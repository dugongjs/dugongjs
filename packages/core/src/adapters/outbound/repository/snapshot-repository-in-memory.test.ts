import { randomUUID } from "node:crypto";
import { TransactionManagerInMemory } from "../transaction-manager/transaction-manager-in-memory.js";
import { SnapshotRepositoryInMemory } from "./snapshot-repository-in-memory.js";

describe("SnapshotRepositoryInMemory", () => {
    it("should return the latest snapshot by sequence number", async () => {
        const repository = new SnapshotRepositoryInMemory();
        const aggregateId = randomUUID();

        await repository.saveSnapshot(null, {
            origin: "TestOrigin",
            aggregateType: "TestAggregate",
            aggregateId,
            domainEventSequenceNumber: 1,
            snapshotData: { value: 1 }
        });

        await repository.saveSnapshot(null, {
            origin: "TestOrigin",
            aggregateType: "TestAggregate",
            aggregateId,
            domainEventSequenceNumber: 2,
            snapshotData: { value: 2 }
        });

        const latestSnapshot = await repository.getLatestSnapshot(null, "TestOrigin", "TestAggregate", aggregateId);

        expect(latestSnapshot).not.toBeNull();
        expect(latestSnapshot!.domainEventSequenceNumber).toBe(2);
        expect(latestSnapshot!.snapshotData).toEqual({ value: 2 });
    });

    it("should support transactional rollback", async () => {
        const repository = new SnapshotRepositoryInMemory();
        const transactionManager = new TransactionManagerInMemory();
        const aggregateId = randomUUID();

        await expect(
            transactionManager.transaction(async (transactionContext) => {
                await repository.saveSnapshot(transactionContext, {
                    origin: "TestOrigin",
                    aggregateType: "TestAggregate",
                    aggregateId,
                    domainEventSequenceNumber: 1,
                    snapshotData: { value: 1 }
                });

                throw new Error("Rollback");
            })
        ).rejects.toThrow("Rollback");

        const latestSnapshot = await repository.getLatestSnapshot(null, "TestOrigin", "TestAggregate", aggregateId);

        expect(latestSnapshot).toBeNull();
    });
});
