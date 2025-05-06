import { WaitForMessageConsumer, type WaitForMessageConsumerOptions } from "@dugongjs/core";
import { ConsumedMessageEntity, ConsumedMessageRepositoryTypeOrm } from "@dugongjs/typeorm";
import { MessageConsumerKafkajs } from "../../../../src/adapters/inbound/message-broker/message-consumer-kafkajs.js";
import { dataSource } from "../setup/data-source.js";
import { kafka } from "../setup/kafkajs.js";
import { Logger } from "./logger.js";

export type WaitForMessageConsumerKafkajsOptions = Omit<
    WaitForMessageConsumerOptions,
    "messageConsumer" | "consumedMessageRepository" | "logger"
>;

export class WaitForMessageConsumerKafkajs extends WaitForMessageConsumer {
    constructor(options: WaitForMessageConsumerKafkajsOptions) {
        super({
            ...options,
            messageConsumer: new MessageConsumerKafkajs(kafka),
            consumedMessageRepository: new ConsumedMessageRepositoryTypeOrm(
                dataSource.getRepository(ConsumedMessageEntity)
            ),
            logger: new Logger()
        });
    }
}
