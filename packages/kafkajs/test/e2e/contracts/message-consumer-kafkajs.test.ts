import { runMessageConsumerContractTests } from "@dugongjs/testing-contracts";
import type { Message } from "kafkajs";
import { randomUUID } from "node:crypto";
import { MessageConsumerKafkaJS } from "../../../src/index.js";
import { kafka } from "../setup/setup/kafkajs.js";
import {
    createTopic,
    normalizeConsumedKafkaMessage,
    normalizeKafkaMessage,
    publishMessage
} from "./setup/kafka-contract-test-helpers.js";

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

runMessageConsumerContractTests(async () => {
    const consumer = new MessageConsumerKafkaJS(kafka);

    return {
        consumer,
        cleanup: async () => {
            await consumer.disconnect();
        },
        prepareMessageChannel: async (messageChannelId: string) => {
            await createTopic(kafka, messageChannelId);
        },
        createMessage: createKafkaMessage,
        publishMessage: async (messageChannelId: string, message: Message) => {
            await publishMessage(kafka, messageChannelId, message);
        },
        normalizeConsumedMessageForComparison: normalizeConsumedKafkaMessage,
        normalizeExpectedMessageForComparison: normalizeKafkaMessage
    };
});
