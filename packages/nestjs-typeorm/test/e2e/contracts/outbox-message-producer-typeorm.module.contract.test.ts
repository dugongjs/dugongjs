import { IMessageProducer, IOutboundMessageMapper } from "@dugongjs/core";
import { runMessageProducerContractTests } from "@dugongjs/testing-contracts";
import type { OutboxRecord } from "@dugongjs/typeorm";
import { randomUUID } from "node:crypto";
import { clearAllEntities, createTestingApp, type TestingApp } from "../setup/app/testing-app.js";
import { activeDriver } from "../setup/drivers/active-driver.js";

let testingApp: TestingApp | undefined;

async function getTestingApp(): Promise<TestingApp> {
    testingApp ??= await createTestingApp([activeDriver.modules.outboxMessageProducer.forRoot()]);

    return testingApp;
}

runMessageProducerContractTests(async () => {
    const { app, dataSource } = await getTestingApp();

    expect(app.get(IOutboundMessageMapper)).toBeDefined();

    return {
        producer: app.get(IMessageProducer),
        cleanup: () => clearAllEntities(dataSource),
        createMessage: (overrides?: Partial<OutboxRecord>): OutboxRecord => ({
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
            dataSource.getRepository(activeDriver.entities.outbox).find({
                where: { channelId: messageChannelId },
                order: { sequenceNumber: "ASC" }
            }),
        mapExpectedPublishedMessage: (message: OutboxRecord, messageChannelId: string) => ({
            ...message,
            channelId: messageChannelId
        }),
        normalizePublishedMessageForComparison: (message) => ({
            ...(message as OutboxRecord),
            tenantId: (message as OutboxRecord).tenantId ?? null
        }),
        normalizeExpectedPublishedMessageForComparison: (message) => ({
            ...(message as OutboxRecord),
            tenantId: (message as OutboxRecord).tenantId ?? null
        })
    };
});

afterAll(async () => {
    await testingApp?.app.close();
});
