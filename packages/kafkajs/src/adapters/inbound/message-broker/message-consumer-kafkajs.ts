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
    private consumer: Consumer;

    constructor(
        private readonly kafka: Kafka,
        private readonly consumerConfig?: ConsumerConfig,
        private readonly consumerSubscription?: ConsumerSubscribeTopics,
        private readonly runConfig?: ConsumerRunConfig
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
        this.consumer = this.kafka.consumer({ groupId: consumerId, ...(this.consumerConfig ?? {}) });

        await this.consumer.connect();
        await this.consumer.subscribe({ topic: channelId, ...(this.consumerSubscription ?? {}) });
        await this.consumer.run({ eachMessage: onMessage, ...(this.runConfig ?? {}) });
    }

    public async disconnect(): Promise<void> {
        await this.consumer.disconnect();
    }
}
