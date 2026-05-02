import { WaitForMessageConsumer, type WaitForMessageConsumerOptions } from "@dugongjs/core";
import {
    ConsumedMessageEntity,
    ConsumedMessageRepositoryTypeOrm,
    DomainEventEntity,
    DomainEventRepositoryTypeOrm
} from "@dugongjs/typeorm";
import { MessageConsumerKafkaJs } from "../../../../src/adapters/inbound/message-broker/message-consumer-kafkajs.js";
import { dataSource } from "../setup/data-source.js";
import { kafka } from "../setup/kafkajs.js";
import { Logger } from "./logger.js";

export type WaitForMessageConsumerKafkaJsOptions = Omit<
    WaitForMessageConsumerOptions,
    "messageConsumer" | "domainEventRepository" | "consumedMessageRepository" | "logger"
>;

export class WaitForMessageConsumerKafkaJs extends WaitForMessageConsumer {
    constructor(options: WaitForMessageConsumerKafkaJsOptions) {
        super({
            ...options,
            messageConsumer: new MessageConsumerKafkaJs(kafka),
            domainEventRepository: new DomainEventRepositoryTypeOrm(dataSource.getRepository(DomainEventEntity)),
            consumedMessageRepository: new ConsumedMessageRepositoryTypeOrm(
                dataSource.getRepository(ConsumedMessageEntity)
            ),
            logger: new Logger()
        });
    }
}
