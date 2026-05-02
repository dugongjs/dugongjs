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
import { InboundMessageMapperKafkaJs } from "../../../../src/adapters/inbound/message-broker/inbound-message-mapper-kafkajs.js";
import { MessageConsumerKafkaJs } from "../../../../src/adapters/inbound/message-broker/message-consumer-kafkajs.js";
import { dataSource } from "../setup/data-source.js";
import { kafka } from "../setup/kafkajs.js";
import { Logger } from "./logger.js";

export type AggregateMessageConsumerKafkaJsOptions<TAggregateRootClass extends EventSourcedAggregateRoot> = Omit<
    AggregateMessageConsumerOptions<TAggregateRootClass, EachMessagePayload>,
    | "messageConsumer"
    | "inboundMessageMapper"
    | "consumedMessageRepository"
    | "domainEventRepository"
    | "transactionManager"
    | "logger"
>;

export class AggregateMessageConsumerKafkaJs<
    TAggregateRootClass extends EventSourcedAggregateRoot
> extends AggregateMessageConsumer<TAggregateRootClass, EachMessagePayload> {
    constructor(options: AggregateMessageConsumerKafkaJsOptions<TAggregateRootClass>) {
        super({
            ...options,
            messageConsumer: new MessageConsumerKafkaJs(kafka),
            inboundMessageMapper: new InboundMessageMapperKafkaJs(),
            consumedMessageRepository: new ConsumedMessageRepositoryTypeOrm(
                dataSource.getRepository(ConsumedMessageEntity)
            ),
            domainEventRepository: new DomainEventRepositoryTypeOrm(dataSource.getRepository(DomainEventEntity)),
            transactionManager: new TransactionManagerTypeOrm(dataSource),
            logger: new Logger()
        });
    }

    public async disconnect(): Promise<void> {
        await (this["messageConsumer"] as MessageConsumerKafkaJs).disconnect();
    }
}
