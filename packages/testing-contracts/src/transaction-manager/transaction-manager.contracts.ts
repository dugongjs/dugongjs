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
    });
}
