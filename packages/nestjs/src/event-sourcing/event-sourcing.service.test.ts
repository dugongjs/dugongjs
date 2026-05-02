import { Aggregate, AggregateContext } from "@dugongjs/core";
import "reflect-metadata";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EventSourcingService } from "./event-sourcing.service.js";

@Aggregate("TestAggregate")
class TestAggregate {}

describe("EventSourcingService", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    function createService() {
        return new EventSourcingService(
            "CurrentOrigin",
            { transaction: vi.fn(async () => null) } as any,
            {} as any,
            {} as any,
            undefined,
            undefined,
            undefined
        );
    }

    it("should delegate transaction to transaction manager", async () => {
        const runInTransaction = vi.fn(async () => 42);
        const transaction = vi.fn(async (callback: any) => callback({ tx: true }));
        const service = new EventSourcingService(
            "CurrentOrigin",
            { transaction } as any,
            {} as any,
            {} as any,
            undefined,
            undefined,
            undefined
        );

        const result = await service.transaction(runInTransaction);

        expect(transaction).toHaveBeenCalledWith(runInTransaction);
        expect(result).toBe(42);
    });

    it("should set transaction context on factory and manager", () => {
        const service = createService();
        const setFactoryTransactionContext = vi.fn();
        const setManagerTransactionContext = vi.fn();

        vi.spyOn(AggregateContext.prototype, "getFactory").mockReturnValue({
            setTransactionContext: setFactoryTransactionContext
        } as any);
        vi.spyOn(AggregateContext.prototype, "getManager").mockReturnValue({
            setTransactionContext: setManagerTransactionContext
        } as any);

        const transactionContext = { id: "tx-1" } as any;

        const context = service.createAggregateContext(transactionContext, TestAggregate as any);

        expect(context).toBeInstanceOf(AggregateContext);
        expect(setFactoryTransactionContext).toHaveBeenCalledWith(transactionContext);
        expect(setManagerTransactionContext).toHaveBeenCalledWith(transactionContext);
    });

    it("should swallow manager context errors but still set factory context", () => {
        const service = createService();
        const setFactoryTransactionContext = vi.fn();

        vi.spyOn(AggregateContext.prototype, "getFactory").mockReturnValue({
            setTransactionContext: setFactoryTransactionContext
        } as any);
        vi.spyOn(AggregateContext.prototype, "getManager").mockImplementation(() => {
            throw new Error("manager unavailable");
        });

        const transactionContext = { id: "tx-2" } as any;

        expect(() => service.createAggregateContext(transactionContext, TestAggregate as any)).not.toThrow();
        expect(setFactoryTransactionContext).toHaveBeenCalledWith(transactionContext);
    });
});
