import type { IDomainEventRepository, SerializedDomainEvent, TransactionContext } from "@dugongjs/core";
import { v4 as uuidv4 } from "uuid";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

export interface DomainEventRepositoryFixture {
    repository: IDomainEventRepository;
    cleanup: () => Promise<void>;
}

const ORIGIN = "TestOrigin";
const AGGREGATE_TYPE = "TestAggregate";

function makeDomainEvent(
    aggregateId: string,
    sequenceNumber: number,
    overrides: Partial<SerializedDomainEvent> = {}
): SerializedDomainEvent {
    return {
        id: uuidv4(),
        origin: ORIGIN,
        aggregateType: AGGREGATE_TYPE,
        aggregateId,
        type: "TestEvent",
        version: 1,
        sequenceNumber,
        timestamp: new Date(),
        payload: null,
        ...overrides
    };
}

export function runDomainEventRepositoryContractTests(setup: () => Promise<DomainEventRepositoryFixture>): void {
    let fixture: DomainEventRepositoryFixture;
    const ctx: TransactionContext | null = null;

    describe("IDomainEventRepository contract", () => {
        beforeEach(async () => {
            fixture = await setup();
        });

        afterEach(async () => {
            await fixture.cleanup();
        });

        describe("saveDomainEvents / getAggregateDomainEvents", () => {
            it("should return an empty array when no events exist for an aggregate", async () => {
                const result = await fixture.repository.getAggregateDomainEvents(ctx, ORIGIN, AGGREGATE_TYPE, uuidv4());

                expect(result).toEqual([]);
            });

            it("should persist and retrieve domain events in sequence order", async () => {
                const aggregateId = uuidv4();
                const event1 = makeDomainEvent(aggregateId, 1);
                const event2 = makeDomainEvent(aggregateId, 2);

                await fixture.repository.saveDomainEvents(ctx, [event1, event2]);

                const result = await fixture.repository.getAggregateDomainEvents(
                    ctx,
                    ORIGIN,
                    AGGREGATE_TYPE,
                    aggregateId
                );

                expect(result).toHaveLength(2);
                expect(result[0].sequenceNumber).toBe(1);
                expect(result[1].sequenceNumber).toBe(2);
            });

            it("should only return events for the specified aggregate", async () => {
                const aggregateIdA = uuidv4();
                const aggregateIdB = uuidv4();

                await fixture.repository.saveDomainEvents(ctx, [makeDomainEvent(aggregateIdA, 1)]);
                await fixture.repository.saveDomainEvents(ctx, [makeDomainEvent(aggregateIdB, 1)]);

                const result = await fixture.repository.getAggregateDomainEvents(
                    ctx,
                    ORIGIN,
                    AGGREGATE_TYPE,
                    aggregateIdA
                );

                expect(result).toHaveLength(1);
                expect(result[0].aggregateId).toBe(aggregateIdA);
            });

            it("should return events from the given sequence number onwards when fromSequenceNumber is specified", async () => {
                const aggregateId = uuidv4();
                const events = [1, 2, 3, 4].map((seq) => makeDomainEvent(aggregateId, seq));

                await fixture.repository.saveDomainEvents(ctx, events);

                const result = await fixture.repository.getAggregateDomainEvents(
                    ctx,
                    ORIGIN,
                    AGGREGATE_TYPE,
                    aggregateId,
                    null,
                    3
                );

                expect(result).toHaveLength(2);
                expect(result[0].sequenceNumber).toBe(3);
                expect(result[1].sequenceNumber).toBe(4);
            });

            it("should preserve all event fields on round-trip", async () => {
                const aggregateId = uuidv4();
                const event = makeDomainEvent(aggregateId, 1, {
                    payload: { key: "value" },
                    correlationId: uuidv4(),
                    tenantId: "tenant-1",
                    triggeredByUserId: uuidv4(),
                    triggeredByEventId: uuidv4(),
                    metadata: { extra: 42 }
                });

                await fixture.repository.saveDomainEvents(ctx, [event]);

                const [retrieved] = await fixture.repository.getAggregateDomainEvents(
                    ctx,
                    ORIGIN,
                    AGGREGATE_TYPE,
                    aggregateId,
                    event.tenantId
                );

                expect(retrieved.id).toBe(event.id);
                expect(retrieved.type).toBe(event.type);
                expect(retrieved.version).toBe(event.version);
                expect(retrieved.payload).toEqual(event.payload);
                expect(retrieved.correlationId).toBe(event.correlationId);
                expect(retrieved.tenantId).toBe(event.tenantId);
                expect(retrieved.triggeredByUserId).toBe(event.triggeredByUserId);
                expect(retrieved.triggeredByEventId).toBe(event.triggeredByEventId);
                expect(retrieved.metadata).toEqual(event.metadata);
            });
        });

        describe("idempotent saves on duplicate event ID", () => {
            it("should not throw when re-saving an event with the same ID", async () => {
                const aggregateId = uuidv4();
                const event = makeDomainEvent(aggregateId, 1);

                await fixture.repository.saveDomainEvents(ctx, [event]);

                // Re-save the exact same event — should not throw
                await expect(fixture.repository.saveDomainEvents(ctx, [event])).resolves.not.toThrow();

                const stored = await fixture.repository.getAggregateDomainEvents(
                    ctx,
                    ORIGIN,
                    AGGREGATE_TYPE,
                    aggregateId
                );

                expect(stored).toHaveLength(1);
                expect(stored[0].id).toBe(event.id);
            });

            it("should throw when a different event claims an already-used sequence number", async () => {
                const aggregateId = uuidv4();
                const event1 = makeDomainEvent(aggregateId, 1);

                await fixture.repository.saveDomainEvents(ctx, [event1]);

                // Different event, same sequence number — should throw
                const event2 = makeDomainEvent(aggregateId, 1);

                await expect(fixture.repository.saveDomainEvents(ctx, [event2])).rejects.toThrowError(Error);
            });
        });

        describe("optimistic concurrency", () => {
            it("should throw when saving an event with a duplicate sequence number for the same aggregate", async () => {
                const aggregateId = uuidv4();

                await fixture.repository.saveDomainEvents(ctx, [makeDomainEvent(aggregateId, 1)]);

                await expect(
                    fixture.repository.saveDomainEvents(ctx, [makeDomainEvent(aggregateId, 1)])
                ).rejects.toThrowError(Error);
            });

            it("should allow only one concurrent client to append the same next sequence number", async () => {
                const aggregateId = uuidv4();

                const [firstResult, secondResult] = await Promise.allSettled([
                    fixture.repository.saveDomainEvents(ctx, [makeDomainEvent(aggregateId, 1)]),
                    fixture.repository.saveDomainEvents(ctx, [makeDomainEvent(aggregateId, 1)])
                ]);

                const successCount = [firstResult, secondResult].filter(
                    (result) => result.status === "fulfilled"
                ).length;
                const failureCount = [firstResult, secondResult].filter(
                    (result) => result.status === "rejected"
                ).length;

                expect(successCount).toBe(1);
                expect(failureCount).toBe(1);

                const storedEvents = await fixture.repository.getAggregateDomainEvents(
                    ctx,
                    ORIGIN,
                    AGGREGATE_TYPE,
                    aggregateId
                );

                expect(storedEvents).toHaveLength(1);
                expect(storedEvents[0].sequenceNumber).toBe(1);
            });

            it("should allow concurrent appends with same aggregate and sequence number for different tenants", async () => {
                const aggregateId = uuidv4();

                const [tenantAResult, tenantBResult] = await Promise.allSettled([
                    fixture.repository.saveDomainEvents(ctx, [
                        makeDomainEvent(aggregateId, 1, { tenantId: "tenant-a" })
                    ]),
                    fixture.repository.saveDomainEvents(ctx, [
                        makeDomainEvent(aggregateId, 1, { tenantId: "tenant-b" })
                    ])
                ]);

                expect(tenantAResult.status).toBe("fulfilled");
                expect(tenantBResult.status).toBe("fulfilled");

                const tenantAEvents = await fixture.repository.getAggregateDomainEvents(
                    ctx,
                    ORIGIN,
                    AGGREGATE_TYPE,
                    aggregateId,
                    "tenant-a"
                );
                const tenantBEvents = await fixture.repository.getAggregateDomainEvents(
                    ctx,
                    ORIGIN,
                    AGGREGATE_TYPE,
                    aggregateId,
                    "tenant-b"
                );

                expect(tenantAEvents).toHaveLength(1);
                expect(tenantBEvents).toHaveLength(1);
                expect(tenantAEvents[0].sequenceNumber).toBe(1);
                expect(tenantBEvents[0].sequenceNumber).toBe(1);
            });

            it("should treat undefined tenantId as no-tenant scope when retrieving aggregate domain events", async () => {
                const aggregateId = uuidv4();

                await fixture.repository.saveDomainEvents(ctx, [makeDomainEvent(aggregateId, 1)]);
                await fixture.repository.saveDomainEvents(ctx, [
                    makeDomainEvent(aggregateId, 1, { tenantId: "tenant-a" })
                ]);

                const result = await fixture.repository.getAggregateDomainEvents(
                    ctx,
                    ORIGIN,
                    AGGREGATE_TYPE,
                    aggregateId,
                    undefined
                );

                expect(result).toHaveLength(1);
                expect(result[0].tenantId).toBeUndefined();
                expect(result[0].sequenceNumber).toBe(1);
            });
        });

        describe("getAggregateIds", () => {
            it("should return an empty array when no aggregates exist", async () => {
                const result = await fixture.repository.getAggregateIds(ctx, ORIGIN, AGGREGATE_TYPE);

                expect(result).toEqual([]);
            });

            it("should return all distinct aggregate IDs for the given origin and type", async () => {
                const idA = uuidv4();
                const idB = uuidv4();

                await fixture.repository.saveDomainEvents(ctx, [makeDomainEvent(idA, 1), makeDomainEvent(idA, 2)]);
                await fixture.repository.saveDomainEvents(ctx, [makeDomainEvent(idB, 1)]);

                const result = await fixture.repository.getAggregateIds(ctx, ORIGIN, AGGREGATE_TYPE);

                expect(result).toHaveLength(2);
                expect(result).toContain(idA);
                expect(result).toContain(idB);
            });

            it("should scope results to the given origin and aggregate type", async () => {
                const idA = uuidv4();
                const idB = uuidv4();

                await fixture.repository.saveDomainEvents(ctx, [makeDomainEvent(idA, 1)]);
                await fixture.repository.saveDomainEvents(ctx, [{ ...makeDomainEvent(idB, 1), origin: "OtherOrigin" }]);

                const result = await fixture.repository.getAggregateIds(ctx, ORIGIN, AGGREGATE_TYPE);

                expect(result).toHaveLength(1);
                expect(result).toContain(idA);
            });

            it("should treat undefined tenantId as no-tenant scope when retrieving aggregate IDs", async () => {
                const noTenantAggregateId = uuidv4();
                const tenantAggregateId = uuidv4();

                await fixture.repository.saveDomainEvents(ctx, [makeDomainEvent(noTenantAggregateId, 1)]);
                await fixture.repository.saveDomainEvents(ctx, [
                    makeDomainEvent(tenantAggregateId, 1, { tenantId: "tenant-a" })
                ]);

                const result = await fixture.repository.getAggregateIds(ctx, ORIGIN, AGGREGATE_TYPE, undefined);

                expect(result).toEqual([noTenantAggregateId]);
            });
        });
    });
}
