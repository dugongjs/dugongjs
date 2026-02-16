import { type ILogger, type IMessageConsumer } from "@dugongjs/core";
import * as changeCase from "change-case";
import {
    Kafka,
    type Consumer,
    type ConsumerConfig,
    type ConsumerRunConfig,
    type ConsumerSubscribeTopics,
    type EachMessagePayload
} from "kafkajs";
import { MessageChannelParticipantKafkaJS } from "../../common/message-broker/message-channel-participator-kafkajs.js";

/**
 * MessageConsumerKafkaJS is an implementation of the IMessageConsumer interface using the KafkaJS library.
 */
export class MessageConsumerKafkaJS
    extends MessageChannelParticipantKafkaJS
    implements IMessageConsumer<EachMessagePayload>
{
    private consumers: Consumer[] = [];

    constructor(
        private readonly kafka: Kafka,
        private readonly consumerConfig?: ConsumerConfig,
        private readonly consumerSubscribeTopics?: ConsumerSubscribeTopics,
        private readonly consumerRunConfig?: ConsumerRunConfig,
        private readonly logger?: ILogger
    ) {
        super();
    }

    /**
     * Generates a unique message consumer ID based on the provided origin, aggregate type, and consumer name.
     * @param origin The origin or source of the messages (e.g., service name or application name).
     * @param aggregateType The type of aggregate or domain entity that the consumer is interested in (e.g., "Order", "User", etc.).
     * @param consumerName A descriptive name for the consumer, which can help identify its purpose (e.g., "EmailNotificationConsumer", "AnalyticsConsumer", etc.).
     * @returns A unique consumer ID string in kebab-case format, combining the origin, aggregate type, and consumer name. For example: "my-service-order-email-notification-consumer".
     */
    public generateMessageConsumerIdForAggregate(origin: string, aggregateType: string, consumerName: string): string {
        const originKebabCase = changeCase.kebabCase(origin);
        const aggregateTypeKebabCase = changeCase.kebabCase(aggregateType);
        const consumerNameKebabCase = changeCase.kebabCase(consumerName);

        return `${originKebabCase}-${aggregateTypeKebabCase}-${consumerNameKebabCase}`;
    }

    /**
     * Registers a domain event message consumer for a specific channel and consumer ID, with an optional message handler.
     * @param channelId The ID of the message channel (Kafka topic) to subscribe to.
     * @param consumerId The unique ID for the consumer group.
     * @param onMessage An optional asynchronous function that will be called for each received message. If not provided, the consumer will run without a message handler.
     * @returns A promise that resolves when the consumer is successfully registered and running.
     */
    public async registerDomainEventMessageConsumer(
        channelId: string,
        consumerId: string,
        onMessage?: (message: EachMessagePayload) => Promise<void>
    ): Promise<void> {
        const consumer = this.kafka.consumer({ groupId: consumerId, ...(this.consumerConfig ?? {}) });

        await consumer.connect();
        await this.subscribeWithRetry(consumer, channelId);
        await consumer.run({ eachMessage: onMessage, ...(this.consumerRunConfig ?? {}) });

        this.consumers.push(consumer);
    }

    public async disconnect(): Promise<void> {
        await Promise.all(this.consumers.map(async (consumer) => consumer.disconnect()));
    }

    /**
     * Subscribes to a Kafka topic with retry logic to handle the case where the topic might not exist yet.
     * This is required when running Kafka in Kraft mode, as topic creation is asynchronous.
     * @param consumer The Kafka consumer instance.
     * @param topic The topic to subscribe to.
     * @param retries The number of retry attempts before giving up.
     * @param delayMs The delay in milliseconds between retry attempts.
     * @returns A promise that resolves when the subscription is successful, or rejects if all retry attempts fail.
     */
    private async subscribeWithRetry(consumer: Consumer, topic: string, retries = 10, delayMs = 300): Promise<void> {
        for (let i = 0; i < retries; i++) {
            try {
                await consumer.subscribe({ topic, ...(this.consumerSubscribeTopics ?? {}) });
                return;
            } catch (err: any) {
                const isRetryable = err?.type === "UNKNOWN_TOPIC_OR_PARTITION";

                if (!isRetryable) {
                    this.logger?.error(`Failed to subscribe to topic "${topic}": ${err.message}`);
                    throw err;
                }

                this.logger?.warn(
                    `Topic "${topic}" does not exist. Attempt ${i + 1} of ${retries}. Retrying in ${delayMs}ms...`
                );

                await new Promise((r) => setTimeout(r, delayMs));
            }
        }
    }
}
