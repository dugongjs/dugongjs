import type { DugongAdapters } from "@dugongjs/nestjs";
import { InboundMessageMapperKafkaJSService } from "../modules/message-consumer-kafkajs/inbound-message-mapper-kafkajs.service.js";
import { MessageConsumerKafkaJSService } from "../modules/message-consumer-kafkajs/message-consumer-kafkajs.service.js";

export const kafkaJSMessageConsumerAdapter = {
    messageConsumer: MessageConsumerKafkaJSService,
    inboundMessageMapper: InboundMessageMapperKafkaJSService
} satisfies DugongAdapters;
