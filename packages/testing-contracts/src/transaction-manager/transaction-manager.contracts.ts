import type { ITransactionManager, TransactionContext } from "@dugongjs/core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

export interface TransactionManagerFixture {
    transactionManager: ITransactionManager;
    cleanup: () => Promise<void>;
    createProbeId: () => string;
    persistProbe: (context: TransactionContext, probeId: string) => Promise<void>;
    hasProbe: (probeId: string) => Promise<boolean>;
}

export function runTransactionManagerContractTests(setup: () => Promise<TransactionManagerFixture>): void {
    let fixture: TransactionManagerFixture;

    describe("ITransactionManager contract", () => {
        beforeEach(async () => {
            fixture = await setup();
        });

        afterEach(async () => {
            await fixture.cleanup();
        });

        it("should execute the callback and return its resolved value", async () => {
            const result = await fixture.transactionManager.transaction(async () => 42);

            expect(result).toBe(42);
        });

        it("should pass a transaction context object to the callback", async () => {
            let receivedContext: TransactionContext | undefined;

            await fixture.transactionManager.transaction(async (context) => {
                receivedContext = context;
                return null;
            });

            expect(receivedContext).toBeDefined();
            expect(typeof receivedContext).toBe("object");
        });

        it("should commit writes when the callback resolves", async () => {
            const probeId = fixture.createProbeId();

            await fixture.transactionManager.transaction(async (context) => {
                await fixture.persistProbe(context, probeId);
                return null;
            });

            await expect(fixture.hasProbe(probeId)).resolves.toBe(true);
        });

        it("should rollback writes when the callback throws", async () => {
            const probeId = fixture.createProbeId();

            await expect(
                fixture.transactionManager.transaction(async (context) => {
                    await fixture.persistProbe(context, probeId);
                    throw new Error("Force rollback");
                })
            ).rejects.toThrow("Force rollback");

            await expect(fixture.hasProbe(probeId)).resolves.toBe(false);
        });

        it("should rollback writes when the callback returns a rejected promise", async () => {
            const probeId = fixture.createProbeId();

            await expect(
                fixture.transactionManager.transaction(async (context) => {
                    await fixture.persistProbe(context, probeId);
                    return Promise.reject(new Error("Rejected rollback"));
                })
            ).rejects.toThrow("Rejected rollback");

            await expect(fixture.hasProbe(probeId)).resolves.toBe(false);
        });

        it("should rollback all writes in a transaction when one operation fails", async () => {
            const firstProbeId = fixture.createProbeId();
            const secondProbeId = fixture.createProbeId();

            await expect(
                fixture.transactionManager.transaction(async (context) => {
                    await fixture.persistProbe(context, firstProbeId);
                    await fixture.persistProbe(context, secondProbeId);
                    throw new Error("Atomic rollback");
                })
            ).rejects.toThrow("Atomic rollback");

            await expect(fixture.hasProbe(firstProbeId)).resolves.toBe(false);
            await expect(fixture.hasProbe(secondProbeId)).resolves.toBe(false);
        });

        it("should keep uncommitted writes invisible outside the transaction until commit", async () => {
            const probeId = fixture.createProbeId();

            await fixture.transactionManager.transaction(async (context) => {
                await fixture.persistProbe(context, probeId);

                await expect(fixture.hasProbe(probeId)).resolves.toBe(false);
            });

            await expect(fixture.hasProbe(probeId)).resolves.toBe(true);
        });

        it("should isolate transaction contexts when transactions run in parallel", async () => {
            const probeA = fixture.createProbeId();
            const probeB = fixture.createProbeId();

            const [contextA, contextB] = await Promise.all([
                fixture.transactionManager.transaction(async (context) => {
                    await fixture.persistProbe(context, probeA);
                    return context;
                }),
                fixture.transactionManager.transaction(async (context) => {
                    await fixture.persistProbe(context, probeB);
                    return context;
                })
            ]);

            expect(contextA).not.toBe(contextB);
            await expect(fixture.hasProbe(probeA)).resolves.toBe(true);
            await expect(fixture.hasProbe(probeB)).resolves.toBe(true);
        });

        it("should not rollback a successful transaction when a parallel transaction fails", async () => {
            const committedProbeId = fixture.createProbeId();
            const rolledBackProbeId = fixture.createProbeId();

            const [committedResult, rejectedResult] = await Promise.allSettled([
                fixture.transactionManager.transaction(async (context) => {
                    await fixture.persistProbe(context, committedProbeId);
                }),
                fixture.transactionManager.transaction(async (context) => {
                    await fixture.persistProbe(context, rolledBackProbeId);
                    throw new Error("Parallel rollback");
                })
            ]);

            expect(committedResult.status).toBe("fulfilled");
            expect(rejectedResult.status).toBe("rejected");
            await expect(fixture.hasProbe(committedProbeId)).resolves.toBe(true);
            await expect(fixture.hasProbe(rolledBackProbeId)).resolves.toBe(false);
        });
    });
}
