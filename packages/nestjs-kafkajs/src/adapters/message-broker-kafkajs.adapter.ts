import type { DugongAdapters } from "@dugongjs/nestjs";
import { messageConsumerKafkaJsAdapter } from "./message-consumer-kafkajs.adapter.js";
import { messageProducerKafkaJsAdapter } from "./message-producer-kafkajs.adapter.js";

export const messageBrokerKafkaJsAdapter = {
    ...messageConsumerKafkaJsAdapter,
    ...messageProducerKafkaJsAdapter
} satisfies DugongAdapters;
