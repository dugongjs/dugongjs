import { type IMessageConsumer } from "@dugongjs/core";
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

export class MessageConsumerKafkaJS
    extends MessageChannelParticipantKafkaJS
    implements IMessageConsumer<EachMessagePayload>
{
    private consumers: Consumer[] = [];

    constructor(
        private readonly kafka: Kafka,
        private readonly consumerConfig?: ConsumerConfig,
        private readonly consumerSubscribeTopics?: ConsumerSubscribeTopics,
        private readonly consumerRunConfig?: ConsumerRunConfig
    ) {
        super();
    }

    public generateMessageConsumerIdForAggregate(origin: string, aggregateType: string, consumerName: string): string {
        const originKebabCase = changeCase.kebabCase(origin);
        const aggregateTypeKebabCase = changeCase.kebabCase(aggregateType);
        const consumerNameKebabCase = changeCase.kebabCase(consumerName);

        return `${originKebabCase}-${aggregateTypeKebabCase}-${consumerNameKebabCase}`;
    }

    public async registerDomainEventMessageConsumer(
        channelId: string,
        consumerId: string,
        onMessage?: (message: EachMessagePayload) => Promise<void>
    ): Promise<void> {
        const consumer = this.kafka.consumer({ groupId: consumerId, ...(this.consumerConfig ?? {}) });

        await consumer.connect();
        await consumer.subscribe({ topic: channelId, ...(this.consumerSubscribeTopics ?? {}) });
        await consumer.run({ eachMessage: onMessage, ...(this.consumerRunConfig ?? {}) });

        this.consumers.push(consumer);
    }

    public async disconnect(): Promise<void> {
        await Promise.all(this.consumers.map(async (consumer) => consumer.disconnect()));
    }
}
