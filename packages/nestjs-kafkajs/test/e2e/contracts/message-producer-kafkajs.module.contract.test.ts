import { IMessageProducer, IOutboundMessageMapper } from "@dugongjs/core";
import { runMessageProducerContractTests } from "@dugongjs/testing-contracts";
import { Test, type TestingModule } from "@nestjs/testing";
import type { Kafka, Message } from "kafkajs";
import { vi } from "vitest";
import { KafkaModule } from "../../../src/modules/kafka/kafka.module.js";
import { KafkaService } from "../../../src/modules/kafka/kafka.service.js";
import { MessageProducerKafkaJsModule } from "../../../src/modules/message-producer-kafkajs/message-producer-kafkajs.module.js";
import {
    collectMessages,
    createKafkaMessage,
    createTopic,
    normalizeKafkaMessage
} from "./setup/kafka-contract-test-helpers.js";

vi.setConfig({ testTimeout: 20000 });

let app: TestingModule | undefined;
let kafka: Kafka | undefined;

async function getApp(): Promise<TestingModule> {
    if (!app) {
        app = await Test.createTestingModule({
            imports: [
                KafkaModule.forRoot({
                    brokers: [process.env.KAFKA_BOOTSTRAP_SERVER!]
                }),
                MessageProducerKafkaJsModule.forRoot()
            ]
        }).compile();

        await app.init();
        kafka = app.get(KafkaService);
    }

    return app;
}

runMessageProducerContractTests(async () => {
    const nestApp = await getApp();
    const producer = nestApp.get(IMessageProducer);

    await producer.connect();

    expect(nestApp.get(IOutboundMessageMapper)).toBeDefined();

    return {
        producer,
        cleanup: async () => {
            await producer.disconnect();
        },
        prepareMessageChannel: async (messageChannelId: string) => {
            await createTopic(kafka!, messageChannelId);
        },
        createMessage: (overrides?: Partial<Message>) => createKafkaMessage(overrides),
        getPublishedMessages: async (messageChannelId: string) => collectMessages(kafka!, messageChannelId),
        mapExpectedPublishedMessage: (message: Message) => message,
        normalizePublishedMessageForComparison: normalizeKafkaMessage,
        normalizeExpectedPublishedMessageForComparison: normalizeKafkaMessage
    };
});

afterAll(async () => {
    await app?.close();
});
