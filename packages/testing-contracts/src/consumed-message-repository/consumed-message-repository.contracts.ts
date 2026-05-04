import type { IConsumedMessageRepository, TransactionContext } from "@dugongjs/core";
import { v4 as uuidv4 } from "uuid";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

export interface ConsumedMessageRepositoryFixture {
    repository: IConsumedMessageRepository;
    cleanup: () => Promise<void>;
}

const CONSUMER_ID = "TestConsumer";

export function runConsumedMessageRepositoryContractTests(
    setup: () => Promise<ConsumedMessageRepositoryFixture>
): void {
    let fixture: ConsumedMessageRepositoryFixture;
    const ctx: TransactionContext | null = null;

    describe("IConsumedMessageRepository contract", () => {
        beforeEach(async () => {
            fixture = await setup();
        });

        afterEach(async () => {
            await fixture.cleanup();
        });

        describe("checkIfMessageIsConsumed", () => {
            it("should return false when the message has not been marked as consumed", async () => {
                const result = await fixture.repository.checkIfMessageIsConsumed(ctx, uuidv4(), CONSUMER_ID);

                expect(result).toBe(false);
            });

            it("should return true after the message has been marked as consumed", async () => {
                const domainEventId = uuidv4();

                await fixture.repository.markMessageAsConsumed(ctx, domainEventId, CONSUMER_ID);

                const result = await fixture.repository.checkIfMessageIsConsumed(ctx, domainEventId, CONSUMER_ID);

                expect(result).toBe(true);
            });

            it("should scope the consumed marker to the given consumer", async () => {
                const domainEventId = uuidv4();

                await fixture.repository.markMessageAsConsumed(ctx, domainEventId, CONSUMER_ID);

                const result = await fixture.repository.checkIfMessageIsConsumed(ctx, domainEventId, "OtherConsumer");

                expect(result).toBe(false);
            });

            it("should scope the consumed marker to the given tenant when tenantId is provided", async () => {
                const domainEventId = uuidv4();

                await fixture.repository.markMessageAsConsumed(ctx, domainEventId, CONSUMER_ID, "tenant-a");

                const sameTenant = await fixture.repository.checkIfMessageIsConsumed(
                    ctx,
                    domainEventId,
                    CONSUMER_ID,
                    "tenant-a"
                );
                const otherTenant = await fixture.repository.checkIfMessageIsConsumed(
                    ctx,
                    domainEventId,
                    CONSUMER_ID,
                    "tenant-b"
                );

                expect(sameTenant).toBe(true);
                expect(otherTenant).toBe(false);
            });
        });

        describe("markMessageAsConsumed", () => {
            it("should be idempotent only at the check layer, not by inserting duplicate rows silently", async () => {
                const domainEventId = uuidv4();

                await fixture.repository.markMessageAsConsumed(ctx, domainEventId, CONSUMER_ID);

                await expect(
                    fixture.repository.markMessageAsConsumed(ctx, domainEventId, CONSUMER_ID)
                ).rejects.toThrowError(Error);
            });

            it("should allow the same message to be marked as consumed by different consumers", async () => {
                const domainEventId = uuidv4();

                await fixture.repository.markMessageAsConsumed(ctx, domainEventId, CONSUMER_ID);
                await fixture.repository.markMessageAsConsumed(ctx, domainEventId, "OtherConsumer");

                const resultA = await fixture.repository.checkIfMessageIsConsumed(ctx, domainEventId, CONSUMER_ID);
                const resultB = await fixture.repository.checkIfMessageIsConsumed(ctx, domainEventId, "OtherConsumer");

                expect(resultA).toBe(true);
                expect(resultB).toBe(true);
            });
        });
    });
}
