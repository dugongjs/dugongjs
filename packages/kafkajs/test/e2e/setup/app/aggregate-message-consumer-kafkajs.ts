import {
    AggregateMessageConsumer,
    type AggregateMessageConsumerOptions,
    type EventSourcedAggregateRoot
} from "@dugongjs/core";
import {
    ConsumedMessageEntity,
    ConsumedMessageRepositoryTypeOrm,
    DomainEventEntity,
    DomainEventRepositoryTypeOrm,
    TransactionManagerTypeOrm
} from "@dugongjs/typeorm";
import type { EachMessagePayload } from "kafkajs";
import { InboundMessageMapperKafkaJS } from "../../../../src/adapters/inbound/message-broker/inbound-message-mapper-kafkajs.js";
import { MessageConsumerKafkaJS } from "../../../../src/adapters/inbound/message-broker/message-consumer-kafkajs.js";
import { dataSource } from "../setup/data-source.js";
import { kafka } from "../setup/kafkajs.js";
import { Logger } from "./logger.js";

export type AggregateMessageConsumerKafkaJSOptions<TAggregateRootClass extends EventSourcedAggregateRoot> = Omit<
    AggregateMessageConsumerOptions<TAggregateRootClass, EachMessagePayload>,
    | "messageConsumer"
    | "inboundMessageMapper"
    | "consumedMessageRepository"
    | "domainEventRepository"
    | "transactionManager"
    | "logger"
>;

export class AggregateMessageConsumerKafkaJS<
    TAggregateRootClass extends EventSourcedAggregateRoot
> extends AggregateMessageConsumer<TAggregateRootClass, EachMessagePayload> {
    constructor(options: AggregateMessageConsumerKafkaJSOptions<TAggregateRootClass>) {
        super({
            ...options,
            messageConsumer: new MessageConsumerKafkaJS(kafka),
            inboundMessageMapper: new InboundMessageMapperKafkaJS(),
            consumedMessageRepository: new ConsumedMessageRepositoryTypeOrm(
                dataSource.getRepository(ConsumedMessageEntity)
            ),
            domainEventRepository: new DomainEventRepositoryTypeOrm(dataSource.getRepository(DomainEventEntity)),
            transactionManager: new TransactionManagerTypeOrm(dataSource),
            logger: new Logger()
        });
    }

    public async disconnect(): Promise<void> {
        await (this["messageConsumer"] as MessageConsumerKafkaJS).disconnect();
    }
}
