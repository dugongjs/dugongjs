import type { DugongAdapters } from "@dugongjs/nestjs";
import { MessageProducerKafkaJsService } from "../modules/message-producer-kafkajs/message-producer-kafkajs.service.js";
import { OutboundMessageMapperKafkaJsService } from "../modules/message-producer-kafkajs/outbound-message-mapper-kafkajs.service.js";

export const kafkaJsMessageProducerAdapter = {
    messageProducer: MessageProducerKafkaJsService,
    outboundMessageMapper: OutboundMessageMapperKafkaJsService
} satisfies DugongAdapters;
