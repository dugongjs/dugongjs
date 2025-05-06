import {
    AbstractEventSourcedAggregateRoot,
    AggregateMessageConsumer,
    type AggregateMessageConsumerOptions,
    type RemoveAbstract
} from "@dugongjs/core";
import {
    ConsumedMessageEntity,
    ConsumedMessageRepositoryTypeOrm,
    DomainEventEntity,
    DomainEventRepositoryTypeOrm,
    TransactionManagerTypeOrm
} from "@dugongjs/typeorm";
import type { EachMessagePayload } from "kafkajs";
import { MessageSerdesKafkajs } from "../../../../src/adapters/common/message-broker/message-serdes-kafkajs.js";
import { MessageConsumerKafkajs } from "../../../../src/adapters/inbound/message-broker/message-consumer-kafkajs.js";
import { dataSource } from "../setup/data-source.js";
import { kafka } from "../setup/kafkajs.js";
import { Logger } from "./logger.js";

export type AggregateMessageConsumerKafkajsOptions<
    TAggregateRootClass extends RemoveAbstract<typeof AbstractEventSourcedAggregateRoot>
> = Omit<
    AggregateMessageConsumerOptions<TAggregateRootClass, EachMessagePayload>,
    | "messageConsumer"
    | "messageSerdes"
    | "consumedMessageRepository"
    | "domainEventRepository"
    | "transactionManager"
    | "logger"
>;

export class AggregateMessageConsumerKafkajs<
    TAggregateRootClass extends RemoveAbstract<typeof AbstractEventSourcedAggregateRoot>
> extends AggregateMessageConsumer<TAggregateRootClass, EachMessagePayload> {
    constructor(options: AggregateMessageConsumerKafkajsOptions<TAggregateRootClass>) {
        super({
            ...options,
            messageConsumer: new MessageConsumerKafkajs(kafka),
            messageSerdes: new MessageSerdesKafkajs(),
            consumedMessageRepository: new ConsumedMessageRepositoryTypeOrm(
                dataSource.getRepository(ConsumedMessageEntity)
            ),
            domainEventRepository: new DomainEventRepositoryTypeOrm(dataSource.getRepository(DomainEventEntity)),
            transactionManager: new TransactionManagerTypeOrm(dataSource),
            logger: new Logger()
        });
    }

    public async disconnect(): Promise<void> {
        await (this["messageConsumer"] as MessageConsumerKafkajs).disconnect();
    }
}
