import type { ISnapshotRepository, SerializedSnapshot, TransactionContext } from "@dugongjs/core";
import { v4 as uuidv4 } from "uuid";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

export interface SnapshotRepositoryFixture {
    repository: ISnapshotRepository;
    cleanup: () => Promise<void>;
}

const ORIGIN = "TestOrigin";
const AGGREGATE_TYPE = "TestAggregate";

function makeSnapshot(
    aggregateId: string,
    sequenceNumber: number,
    overrides: Partial<SerializedSnapshot> = {}
): SerializedSnapshot {
    return {
        origin: ORIGIN,
        aggregateType: AGGREGATE_TYPE,
        aggregateId,
        domainEventSequenceNumber: sequenceNumber,
        snapshotData: { value: "test" },
        ...overrides
    };
}

export function runSnapshotRepositoryContractTests(setup: () => Promise<SnapshotRepositoryFixture>): void {
    let fixture: SnapshotRepositoryFixture;
    const ctx: TransactionContext | null = null;

    describe("ISnapshotRepository contract", () => {
        beforeEach(async () => {
            fixture = await setup();
        });

        afterEach(async () => {
            await fixture.cleanup();
        });

        describe("getLatestSnapshot", () => {
            it("should return null when no snapshot exists for an aggregate", async () => {
                const result = await fixture.repository.getLatestSnapshot(ctx, ORIGIN, AGGREGATE_TYPE, uuidv4());

                expect(result).toBeNull();
            });

            it("should return the saved snapshot", async () => {
                const aggregateId = uuidv4();
                const snapshot = makeSnapshot(aggregateId, 10);

                await fixture.repository.saveSnapshot(ctx, snapshot);

                const result = await fixture.repository.getLatestSnapshot(ctx, ORIGIN, AGGREGATE_TYPE, aggregateId);

                expect(result).not.toBeNull();
                expect(result!.aggregateId).toBe(aggregateId);
                expect(result!.domainEventSequenceNumber).toBe(10);
                expect(result!.snapshotData).toEqual(snapshot.snapshotData);
            });

            it("should return the snapshot with the highest sequence number", async () => {
                const aggregateId = uuidv4();

                await fixture.repository.saveSnapshot(ctx, makeSnapshot(aggregateId, 10));
                await fixture.repository.saveSnapshot(ctx, makeSnapshot(aggregateId, 20));

                const result = await fixture.repository.getLatestSnapshot(ctx, ORIGIN, AGGREGATE_TYPE, aggregateId);

                expect(result!.domainEventSequenceNumber).toBe(20);
            });

            it("should scope results to the given aggregate ID", async () => {
                const idA = uuidv4();
                const idB = uuidv4();

                await fixture.repository.saveSnapshot(ctx, makeSnapshot(idA, 10));

                const result = await fixture.repository.getLatestSnapshot(ctx, ORIGIN, AGGREGATE_TYPE, idB);

                expect(result).toBeNull();
            });
        });

        describe("saveSnapshot", () => {
            it("should preserve all snapshot fields on round-trip", async () => {
                const aggregateId = uuidv4();
                const snapshot = makeSnapshot(aggregateId, 5, {
                    tenantId: "tenant-1",
                    snapshotData: { nested: { value: 42 } }
                });

                await fixture.repository.saveSnapshot(ctx, snapshot);

                const result = await fixture.repository.getLatestSnapshot(ctx, ORIGIN, AGGREGATE_TYPE, aggregateId);

                expect(result!.tenantId).toBe(snapshot.tenantId);
                expect(result!.snapshotData).toEqual(snapshot.snapshotData);
            });
        });
    });
}
