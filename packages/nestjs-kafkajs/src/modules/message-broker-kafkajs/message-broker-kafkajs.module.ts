import { Module } from "@nestjs/common";
import { MessageConsumerKafkaJSModule } from "../message-consumer-kafkajs/message-consumer-kafkajs.module.js";
import { MessageProducerKafkaJSModule } from "../message-producer-kafkajs/message-producer-kafkajs.module.js";

@Module({
    imports: [MessageConsumerKafkaJSModule, MessageProducerKafkaJSModule],
    exports: [MessageConsumerKafkaJSModule, MessageProducerKafkaJSModule]
})
export class MessageBrokerKafkaJSModule {}
