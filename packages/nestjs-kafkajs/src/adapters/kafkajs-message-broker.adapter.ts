import type { DugongAdapters } from "@dugongjs/nestjs";
import { kafkaJsMessageConsumerAdapter } from "./kafkajs-message-consumer.adapter.js";
import { kafkaJsMessageProducerAdapter } from "./kafkajs-message-producer.adapter.js";

export const kafkaJsMessageBrokerAdapter = {
    ...kafkaJsMessageConsumerAdapter,
    ...kafkaJsMessageProducerAdapter
} satisfies DugongAdapters;
