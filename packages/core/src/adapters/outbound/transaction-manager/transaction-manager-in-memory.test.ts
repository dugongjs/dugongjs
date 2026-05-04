import { randomUUID } from "node:crypto";
import { DomainEventRepositoryInMemory } from "../repository/domain-event-repository-in-memory.js";
import { TransactionManagerInMemory } from "./transaction-manager-in-memory.js";

describe("TransactionManagerInMemory", () => {
    it("should execute the callback and return the callback result", async () => {
        const transactionManager = new TransactionManagerInMemory();

        const result = await transactionManager.transaction(async () => {
            return 42;
        });

        expect(result).toBe(42);
    });

    it("should commit staged writes when the callback resolves", async () => {
        const transactionManager = new TransactionManagerInMemory();
        const repository = new DomainEventRepositoryInMemory();

        const aggregateId = randomUUID();

        await transactionManager.transaction(async (transactionContext) => {
            await repository.saveDomainEvents(transactionContext, [
                {
                    id: randomUUID(),
                    origin: "TestOrigin",
                    aggregateType: "TestAggregate",
                    aggregateId,
                    type: "Created",
                    version: 1,
                    sequenceNumber: 1,
                    timestamp: new Date(),
                    payload: null
                }
            ]);
        });

        const persistedEvents = await repository.getAggregateDomainEvents(
            null,
            "TestOrigin",
            "TestAggregate",
            aggregateId
        );

        expect(persistedEvents).toHaveLength(1);
    });

    it("should rollback staged writes when the callback throws", async () => {
        const transactionManager = new TransactionManagerInMemory();
        const repository = new DomainEventRepositoryInMemory();

        const aggregateId = randomUUID();

        await expect(
            transactionManager.transaction(async (transactionContext) => {
                await repository.saveDomainEvents(transactionContext, [
                    {
                        id: randomUUID(),
                        origin: "TestOrigin",
                        aggregateType: "TestAggregate",
                        aggregateId,
                        type: "Created",
                        version: 1,
                        sequenceNumber: 1,
                        timestamp: new Date(),
                        payload: null
                    }
                ]);

                throw new Error("Force rollback");
            })
        ).rejects.toThrow("Force rollback");

        const persistedEvents = await repository.getAggregateDomainEvents(
            null,
            "TestOrigin",
            "TestAggregate",
            aggregateId
        );

        expect(persistedEvents).toEqual([]);
    });
});
