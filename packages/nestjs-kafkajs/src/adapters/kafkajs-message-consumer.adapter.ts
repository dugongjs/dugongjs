import type { DugongAdapters } from "@dugongjs/nestjs";
import { InboundMessageMapperKafkaJsService } from "../modules/message-consumer-kafkajs/inbound-message-mapper-kafkajs.service.js";
import { MessageConsumerKafkaJsService } from "../modules/message-consumer-kafkajs/message-consumer-kafkajs.service.js";

export const kafkaJsMessageConsumerAdapter = {
    messageConsumer: MessageConsumerKafkaJsService,
    inboundMessageMapper: InboundMessageMapperKafkaJsService
} satisfies DugongAdapters;
