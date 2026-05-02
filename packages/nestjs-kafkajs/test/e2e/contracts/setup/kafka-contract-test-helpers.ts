import type { EachMessagePayload, Kafka, Message } from "kafkajs";
import { randomUUID } from "node:crypto";

export async function createTopic(kafka: Kafka, topic: string): Promise<void> {
    const admin = kafka.admin();

    await admin.connect();

    try {
        await admin.createTopics({
            waitForLeaders: true,
            topics: [{ topic }]
        });
    } finally {
        await admin.disconnect();
    }
}

export async function publishMessage(kafka: Kafka, topic: string, message: Message): Promise<void> {
    const producer = kafka.producer();

    await producer.connect();

    try {
        await producer.send({ topic, messages: [message] });
    } finally {
        await producer.disconnect();
    }
}

export async function collectMessages(kafka: Kafka, topic: string, timeoutMs = 1500, idleMs = 200): Promise<Message[]> {
    const consumer = kafka.consumer({ groupId: `contract-reader-${randomUUID()}` });
    const messages: Message[] = [];
    let lastMessageAt = Date.now();

    await consumer.connect();

    try {
        await consumer.subscribe({ topic, fromBeginning: true });
        void consumer.run({
            eachMessage: async ({ message }) => {
                messages.push(message);
                lastMessageAt = Date.now();
            }
        });

        const start = Date.now();

        while (Date.now() - start < timeoutMs) {
            if (messages.length > 0 && Date.now() - lastMessageAt >= idleMs) {
                break;
            }

            await new Promise((resolve) => setTimeout(resolve, 50));
        }
    } finally {
        await consumer.stop();
        await consumer.disconnect();
    }

    return messages;
}

export function createKafkaMessage(overrides: Partial<Message> = {}): Message {
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

export function normalizeKafkaMessage(message: Message): Record<string, unknown> {
    return {
        key: message.key?.toString() ?? null,
        value: message.value?.toString() ?? null,
        headers: Object.fromEntries(
            Object.entries(message.headers ?? {}).map(([key, value]) => [
                key,
                Array.isArray(value) ? value.map((entry) => entry?.toString() ?? null) : (value?.toString() ?? null)
            ])
        )
    };
}

export function normalizeConsumedKafkaMessage(payload: EachMessagePayload): Record<string, unknown> {
    return normalizeKafkaMessage(payload.message);
}
