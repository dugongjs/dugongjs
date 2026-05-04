import { randomUUID } from "node:crypto";
import { TransactionManagerInMemory } from "../transaction-manager/transaction-manager-in-memory.js";
import { ConsumedMessageRepositoryInMemory } from "./consumed-message-repository-in-memory.js";

describe("ConsumedMessageRepositoryInMemory", () => {
    it("should mark and check consumed messages", async () => {
        const repository = new ConsumedMessageRepositoryInMemory();
        const domainEventId = randomUUID();

        expect(await repository.checkIfMessageIsConsumed(null, domainEventId, "consumer-a")).toBe(false);

        await repository.markMessageAsConsumed(null, domainEventId, "consumer-a");

        expect(await repository.checkIfMessageIsConsumed(null, domainEventId, "consumer-a")).toBe(true);
        expect(await repository.checkIfMessageIsConsumed(null, domainEventId, "consumer-b")).toBe(false);
    });

    it("should enforce uniqueness per domain event, consumer, and tenant", async () => {
        const repository = new ConsumedMessageRepositoryInMemory();
        const domainEventId = randomUUID();

        await repository.markMessageAsConsumed(null, domainEventId, "consumer-a", "tenant-a");

        await expect(repository.markMessageAsConsumed(null, domainEventId, "consumer-a", "tenant-a")).rejects.toThrow();
    });

    it("should support transactional rollback", async () => {
        const repository = new ConsumedMessageRepositoryInMemory();
        const transactionManager = new TransactionManagerInMemory();
        const domainEventId = randomUUID();

        await expect(
            transactionManager.transaction(async (transactionContext) => {
                await repository.markMessageAsConsumed(transactionContext, domainEventId, "consumer-a");
                throw new Error("Rollback");
            })
        ).rejects.toThrow("Rollback");

        expect(await repository.checkIfMessageIsConsumed(null, domainEventId, "consumer-a")).toBe(false);
    });
});
