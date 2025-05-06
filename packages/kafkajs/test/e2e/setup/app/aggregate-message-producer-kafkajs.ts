import {
    AbstractEventSourcedAggregateRoot,
    AggregateMessageProducer,
    type AggregateMessageProducerOptions,
    type RemoveAbstract
} from "@dugongjs/core";
import type { Message } from "kafkajs";
import { MessageSerdesKafkajs } from "../../../../src/adapters/common/message-broker/message-serdes-kafkajs.js";
import { MessageProducerKafkajs } from "../../../../src/adapters/outbound/message-broker/message-producer-kafkajs.js";
import { kafka } from "../setup/kafkajs.js";
import { Logger } from "./logger.js";

export type AggregateMessageProducerKafkajsOptions<
    TAggregateRootClass extends RemoveAbstract<typeof AbstractEventSourcedAggregateRoot>
> = Omit<AggregateMessageProducerOptions<TAggregateRootClass, Message>, "messageProducer" | "messageSerdes">;

export class AggregateMessageProducerKafkajs<
    TAggregateRootClass extends RemoveAbstract<typeof AbstractEventSourcedAggregateRoot>
> extends AggregateMessageProducer<TAggregateRootClass, Message> {
    constructor(options: AggregateMessageProducerKafkajsOptions<TAggregateRootClass>) {
        super({
            ...options,
            messageProducer: new MessageProducerKafkajs(kafka),
            messageSerdes: new MessageSerdesKafkajs(),
            logger: new Logger()
        });
    }

    public async connect(): Promise<void> {
        await (this["messageProducer"] as MessageProducerKafkajs).connect();
    }

    public async disconnect(): Promise<void> {
        await (this["messageProducer"] as MessageProducerKafkajs).disconnect();
    }
}
