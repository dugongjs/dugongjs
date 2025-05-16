import { WaitForMessageConsumer, type WaitForMessageConsumerOptions } from "@dugongjs/core";
import { ConsumedMessageEntity, ConsumedMessageRepositoryTypeOrm } from "@dugongjs/typeorm";
import { MessageConsumerKafkaJS } from "../../../../src/adapters/inbound/message-broker/message-consumer-kafkajs.js";
import { dataSource } from "../setup/data-source.js";
import { kafka } from "../setup/kafkajs.js";
import { Logger } from "./logger.js";

export type WaitForMessageConsumerKafkaJSOptions = Omit<
    WaitForMessageConsumerOptions,
    "messageConsumer" | "consumedMessageRepository" | "logger"
>;

export class WaitForMessageConsumerKafkaJS extends WaitForMessageConsumer {
    constructor(options: WaitForMessageConsumerKafkaJSOptions) {
        super({
            ...options,
            messageConsumer: new MessageConsumerKafkaJS(kafka),
            consumedMessageRepository: new ConsumedMessageRepositoryTypeOrm(
                dataSource.getRepository(ConsumedMessageEntity)
            ),
            logger: new Logger()
        });
    }
}
