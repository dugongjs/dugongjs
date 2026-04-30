import { runMessageProducerContractTests } from "@dugongjs/testing-contracts";
import { faker } from "@faker-js/faker";
import { OutboxEntity, OutboxMessageProducerTypeOrm } from "../../../src/index.js";
import { denormalizeTenantId } from "../../../src/infrastructure/db/no-tenant-id.js";
import { dataSource } from "../setup/setup/data-source.js";

function createOutboxMessage(overrides: Partial<OutboxEntity> = {}): OutboxEntity {
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
    producer: new OutboxMessageProducerTypeOrm(dataSource.getRepository(OutboxEntity)),
    cleanup: async () => {
        await dataSource.getRepository(OutboxEntity).clear();
    },
    createMessage: createOutboxMessage,
    getPublishedMessages: async (messageChannelId) =>
        dataSource.getRepository(OutboxEntity).find({
            where: { channelId: messageChannelId },
            order: { sequenceNumber: "ASC" }
        }),
    mapExpectedPublishedMessage: (message, messageChannelId) => ({
        ...message,
        channelId: messageChannelId
    }),
    normalizePublishedMessageForComparison: (message) => ({
        ...(message as OutboxEntity),
        tenantId: denormalizeTenantId((message as OutboxEntity).tenantId)
    }),
    normalizeExpectedPublishedMessageForComparison: (message) => message
}));
