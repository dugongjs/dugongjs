import {
    AbstractEventSourcedAggregateRoot,
    AggregateMessageProducer,
    type AggregateMessageProducerOptions,
    type RemoveAbstract
} from "@dugongjs/core";
import { TransactionManagerTypeOrm } from "@dugongjs/typeorm";
import type { Message } from "kafkajs";
import { MessageProducerKafkaJS } from "../../../../src/adapters/outbound/message-broker/message-producer-kafkajs.js";
import { OutboundMessageMapperKafkaJS } from "../../../../src/adapters/outbound/message-broker/outbound-message-mapper-kafkajs.js";
import { dataSource } from "../setup/data-source.js";
import { kafka } from "../setup/kafkajs.js";
import { Logger } from "./logger.js";

export type AggregateMessageProducerKafkaJSOptions<
    TAggregateRootClass extends RemoveAbstract<typeof AbstractEventSourcedAggregateRoot>
> = Omit<
    AggregateMessageProducerOptions<TAggregateRootClass, Message>,
    "transactionManager" | "messageProducer" | "outboundMessageMapper" | "logger"
>;

export class AggregateMessageProducerKafkaJS<
    TAggregateRootClass extends RemoveAbstract<typeof AbstractEventSourcedAggregateRoot>
> extends AggregateMessageProducer<TAggregateRootClass, Message> {
    constructor(options: AggregateMessageProducerKafkaJSOptions<TAggregateRootClass>) {
        super({
            ...options,
            transactionManager: new TransactionManagerTypeOrm(dataSource),
            messageProducer: new MessageProducerKafkaJS(kafka),
            outboundMessageMapper: new OutboundMessageMapperKafkaJS(),
            logger: new Logger()
        });
    }

    public async connect(): Promise<void> {
        await (this["messageProducer"] as MessageProducerKafkaJS).connect();
    }

    public async disconnect(): Promise<void> {
        await (this["messageProducer"] as MessageProducerKafkaJS).disconnect();
    }
}
