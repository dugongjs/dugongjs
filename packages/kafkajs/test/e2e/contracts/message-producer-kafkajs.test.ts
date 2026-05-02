import { runMessageProducerContractTests } from "@dugongjs/testing-contracts";
import type { Message } from "kafkajs";
import { randomUUID } from "node:crypto";
import { vi } from "vitest";
import { MessageProducerKafkaJs } from "../../../src/index.js";
import { kafka } from "../setup/setup/kafkajs.js";
import { collectMessages, createTopic, normalizeKafkaMessage } from "./setup/kafka-contract-test-helpers.js";

vi.setConfig({ testTimeout: 20000 });

function createKafkaMessage(overrides: Partial<Message> = {}): Message {
    return {
        key: Buffer.from(randomUUID()),
        value: Buffer.from(JSON.stringify({ id: randomUUID() })),
        headers: {
            eventId: Buffer.from(randomUUID()),
            source: Buffer.from("contract-test")
        },
        ...overrides
    };
}

runMessageProducerContractTests(async () => {
    const producer = new MessageProducerKafkaJs(kafka);

    await producer.connect();

    return {
        producer,
        cleanup: async () => {
            await producer.disconnect();
        },
        prepareMessageChannel: async (messageChannelId: string) => {
            await createTopic(kafka, messageChannelId);
        },
        createMessage: createKafkaMessage,
        getPublishedMessages: async (messageChannelId: string) => collectMessages(kafka, messageChannelId),
        mapExpectedPublishedMessage: (message: Message) => message,
        normalizePublishedMessageForComparison: normalizeKafkaMessage,
        normalizeExpectedPublishedMessageForComparison: normalizeKafkaMessage
    };
});
