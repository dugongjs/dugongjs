import { IMessageProducer, IOutboundMessageMapper } from "@dugongjs/core";
import { runMessageProducerContractTests } from "@dugongjs/testing-contracts";
import { OutboxEntity } from "@dugongjs/typeorm";
import { Test, type TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { randomUUID } from "node:crypto";
import { DataSource } from "typeorm";
import { OutboxMessageProducerTypeOrmModule } from "../../../src/modules/outbox-message-producer-typeorm/outbox-message-producer-typeorm.module.js";

let app: TestingModule | undefined;
let dataSource: DataSource | undefined;

async function getApp(): Promise<TestingModule> {
    if (!app) {
        app = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    type: "postgres",
                    schema: "public",
                    port: +process.env.DB_PORT!,
                    host: process.env.DB_HOST!,
                    username: process.env.DB_USERNAME!,
                    password: process.env.DB_PASSWORD!,
                    database: process.env.DB_NAME!,
                    entities: [OutboxEntity],
                    synchronize: true
                }),
                OutboxMessageProducerTypeOrmModule.forRoot()
            ]
        }).compile();

        dataSource = app.get(DataSource);
    }

    return app;
}

runMessageProducerContractTests(async () => {
    const nestApp = await getApp();
    const producer = nestApp.get(IMessageProducer);

    expect(nestApp.get(IOutboundMessageMapper)).toBeDefined();

    return {
        producer,
        cleanup: async () => {
            await dataSource!.getRepository(OutboxEntity).clear();
        },
        createMessage: (overrides?: Partial<OutboxEntity>): OutboxEntity => ({
            id: randomUUID(),
            origin: "TestOrigin",
            aggregateType: "TestAggregate",
            type: "TestEvent",
            version: 1,
            aggregateId: randomUUID(),
            payload: { key: randomUUID() },
            sequenceNumber: 1,
            timestamp: new Date(),
            tenantId: undefined as any,
            correlationId: randomUUID(),
            triggeredByEventId: randomUUID(),
            triggeredByUserId: randomUUID(),
            metadata: { source: "contract-test" },
            channelId: "",
            ...overrides
        }),
        getPublishedMessages: async (messageChannelId: string) =>
            dataSource!.getRepository(OutboxEntity).find({
                where: { channelId: messageChannelId },
                order: { sequenceNumber: "ASC" }
            }),
        mapExpectedPublishedMessage: (message: OutboxEntity, messageChannelId: string) => ({
            ...message,
            channelId: messageChannelId
        }),
        normalizePublishedMessageForComparison: (message) => ({
            ...(message as OutboxEntity),
            tenantId: (message as OutboxEntity).tenantId ?? undefined
        }),
        normalizeExpectedPublishedMessageForComparison: (message) => ({
            ...(message as OutboxEntity),
            tenantId: (message as OutboxEntity).tenantId ?? "__dugongjs_no_tenant__"
        })
    };
});

afterAll(async () => {
    await app?.close();
});
