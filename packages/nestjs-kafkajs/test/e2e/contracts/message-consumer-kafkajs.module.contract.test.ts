import { IInboundMessageMapper, IMessageConsumer } from "@dugongjs/core";
import { runMessageConsumerContractTests } from "@dugongjs/testing-contracts";
import { Test, type TestingModule } from "@nestjs/testing";
import type { Kafka, Message } from "kafkajs";
import { KafkaModule } from "../../../src/modules/kafka/kafka.module.js";
import { KafkaService } from "../../../src/modules/kafka/kafka.service.js";
import { MessageConsumerKafkaJsModule } from "../../../src/modules/message-consumer-kafkajs/message-consumer-kafkajs.module.js";
import {
    createKafkaMessage,
    createTopic,
    normalizeConsumedKafkaMessage,
    normalizeKafkaMessage,
    publishMessage
} from "./setup/kafka-contract-test-helpers.js";

let app: TestingModule | undefined;
let kafka: Kafka | undefined;

async function getApp(): Promise<TestingModule> {
    if (!app) {
        app = await Test.createTestingModule({
            imports: [
                KafkaModule.forRoot({
                    brokers: [process.env.KAFKA_BOOTSTRAP_SERVER!]
                }),
                MessageConsumerKafkaJsModule.forRoot()
            ]
        }).compile();

        kafka = app.get(KafkaService);
    }

    return app;
}

runMessageConsumerContractTests(async () => {
    const nestApp = await getApp();
    const consumer = nestApp.get(IMessageConsumer);

    expect(nestApp.get(IInboundMessageMapper)).toBeDefined();

    return {
        consumer,
        cleanup: async () => {
            await consumer.disconnect();
        },
        prepareMessageChannel: async (messageChannelId: string) => {
            await createTopic(kafka!, messageChannelId);
        },
        createMessage: (overrides?: Partial<Message>) => createKafkaMessage(overrides),
        publishMessage: async (messageChannelId: string, message: Message) => {
            await publishMessage(kafka!, messageChannelId, message);
        },
        normalizeConsumedMessageForComparison: normalizeConsumedKafkaMessage,
        normalizeExpectedMessageForComparison: normalizeKafkaMessage
    };
});

afterAll(async () => {
    await app?.close();
});
