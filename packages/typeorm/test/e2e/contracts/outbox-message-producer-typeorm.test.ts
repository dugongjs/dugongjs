import { runMessageProducerContractTests } from "@dugongjs/testing-contracts";
import { faker } from "@faker-js/faker";
import { OutboxMessageProducerTypeOrm, type OutboxRecord } from "../../../src/index.js";
import { denormalizeTenantId } from "../../../src/infrastructure/db/no-tenant-id.js";
import { activeDriver } from "../setup/drivers/active-driver.js";
import { dataSource } from "../setup/setup/data-source.js";

function createOutboxMessage(overrides: Partial<OutboxRecord> = {}): OutboxRecord {
    return {
        id: faker.string.uuid(),
        origin: "TestOrigin",
        aggregateType: "TestAggregate",
        type: "TestEvent",
        version: 1,
        aggregateId: faker.string.uuid(),
        payload: { key: faker.word.sample() },
        sequenceNumber: faker.number.int({ min: 1, max: 1000 }),
        timestamp: new Date(),
        tenantId: undefined as any,
        correlationId: faker.string.uuid(),
        triggeredByEventId: faker.string.uuid(),
        triggeredByUserId: faker.string.uuid(),
        metadata: { source: "test" },
        channelId: "",
        ...overrides
    };
}

runMessageProducerContractTests(async () => ({
    producer: new OutboxMessageProducerTypeOrm(dataSource.getRepository(activeDriver.entities.outbox)),
    cleanup: async () => {
        await dataSource.getRepository(activeDriver.entities.outbox).clear();
    },
    createMessage: createOutboxMessage,
    getPublishedMessages: async (messageChannelId) =>
        dataSource.getRepository(activeDriver.entities.outbox).find({
            where: { channelId: messageChannelId },
            order: { sequenceNumber: "ASC" }
        }),
    mapExpectedPublishedMessage: (message, messageChannelId) => ({
        ...message,
        channelId: messageChannelId
    }),
    normalizePublishedMessageForComparison: (message) => ({
        ...(message as OutboxRecord),
        tenantId: denormalizeTenantId((message as OutboxRecord).tenantId)
    }),
    normalizeExpectedPublishedMessageForComparison: (message) => message
}));
