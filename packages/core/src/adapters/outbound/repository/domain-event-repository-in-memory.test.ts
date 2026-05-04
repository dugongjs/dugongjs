import { randomUUID } from "node:crypto";
import type { SerializedDomainEvent } from "../../../domain/index.js";
import { TransactionManagerInMemory } from "../transaction-manager/transaction-manager-in-memory.js";
import { DomainEventRepositoryInMemory } from "./domain-event-repository-in-memory.js";

function createDomainEvent(
    aggregateId: string,
    sequenceNumber: number,
    overrides: Partial<SerializedDomainEvent> = {}
): SerializedDomainEvent {
    return {
        id: randomUUID(),
        origin: "TestOrigin",
        aggregateType: "TestAggregate",
        aggregateId,
        type: "Created",
        version: 1,
        sequenceNumber,
        timestamp: new Date(),
        payload: null,
        ...overrides
    };
}

describe("DomainEventRepositoryInMemory", () => {
    it("should persist and retrieve events in sequence order", async () => {
        const repository = new DomainEventRepositoryInMemory();
        const aggregateId = randomUUID();

        await repository.saveDomainEvents(null, [createDomainEvent(aggregateId, 2), createDomainEvent(aggregateId, 1)]);

        const events = await repository.getAggregateDomainEvents(null, "TestOrigin", "TestAggregate", aggregateId);

        expect(events).toHaveLength(2);
        expect(events[0]!.sequenceNumber).toBe(1);
        expect(events[1]!.sequenceNumber).toBe(2);
    });

    it("should throw on duplicate event id", async () => {
        const repository = new DomainEventRepositoryInMemory();
        const aggregateId = randomUUID();
        const event = createDomainEvent(aggregateId, 1);

        await repository.saveDomainEvents(null, [event]);

        await expect(
            repository.saveDomainEvents(null, [
                {
                    ...createDomainEvent(aggregateId, 2),
                    id: event.id
                }
            ])
        ).rejects.toThrow();
    });

    it("should throw on duplicate sequence for same aggregate and tenant", async () => {
        const repository = new DomainEventRepositoryInMemory();
        const aggregateId = randomUUID();

        await repository.saveDomainEvents(null, [createDomainEvent(aggregateId, 1, { tenantId: "tenant-a" })]);

        await expect(
            repository.saveDomainEvents(null, [createDomainEvent(aggregateId, 1, { tenantId: "tenant-a" })])
        ).rejects.toThrow();
    });

    it("should support transactional rollback", async () => {
        const repository = new DomainEventRepositoryInMemory();
        const transactionManager = new TransactionManagerInMemory();
        const aggregateId = randomUUID();

        await expect(
            transactionManager.transaction(async (transactionContext) => {
                await repository.saveDomainEvents(transactionContext, [createDomainEvent(aggregateId, 1)]);
                throw new Error("Rollback");
            })
        ).rejects.toThrow("Rollback");

        const events = await repository.getAggregateDomainEvents(null, "TestOrigin", "TestAggregate", aggregateId);

        expect(events).toEqual([]);
    });
});
