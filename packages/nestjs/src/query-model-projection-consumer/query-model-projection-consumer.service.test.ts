import "reflect-metadata";
import { describe, expect, it, vi } from "vitest";
import { QueryModelProjectionConsumerService } from "./query-model-projection-consumer.service.js";

class TestAggregate {}

describe("QueryModelProjectionConsumerService", () => {
    it("should delegate getAggregateClass to projection handler", () => {
        const eventSourcingService = { createAggregateContext: vi.fn() } as any;
        const queryModelProjectionHandler = {
            getAggregateClass: vi.fn(() => TestAggregate)
        } as any;

        const service = new QueryModelProjectionConsumerService(eventSourcingService, queryModelProjectionHandler);

        expect(service.getAggregateClass()).toBe(TestAggregate);
        expect(queryModelProjectionHandler.getAggregateClass).toHaveBeenCalledTimes(1);
    });

    it("should do nothing when aggregate cannot be built", async () => {
        const aggregateContext = {
            build: vi.fn(async () => null)
        } as any;
        const eventSourcingService = {
            createAggregateContext: vi.fn(() => aggregateContext)
        } as any;
        const queryModelProjectionHandler = {
            getAggregateClass: vi.fn(() => TestAggregate),
            updateQueryModel: vi.fn(),
            deleteQueryModel: vi.fn()
        } as any;

        const service = new QueryModelProjectionConsumerService(eventSourcingService, queryModelProjectionHandler);
        const transactionContext = { id: "tx" } as any;
        const context = {
            transactionContext,
            domainEvent: {
                getAggregateId: () => "aggregate-1"
            }
        } as any;

        await service.updateQueryModel(context);

        expect(eventSourcingService.createAggregateContext).toHaveBeenCalledWith(transactionContext, TestAggregate);
        expect(aggregateContext.build).toHaveBeenCalledWith("aggregate-1", { returnDeleted: true });
        expect(queryModelProjectionHandler.updateQueryModel).not.toHaveBeenCalled();
        expect(queryModelProjectionHandler.deleteQueryModel).not.toHaveBeenCalled();
    });

    it("should delete query model when aggregate is deleted", async () => {
        const aggregate = {
            isDeleted: () => true
        } as any;
        const aggregateContext = {
            build: vi.fn(async () => aggregate)
        } as any;
        const eventSourcingService = {
            createAggregateContext: vi.fn(() => aggregateContext)
        } as any;
        const queryModelProjectionHandler = {
            getAggregateClass: vi.fn(() => TestAggregate),
            updateQueryModel: vi.fn(),
            deleteQueryModel: vi.fn(async () => undefined)
        } as any;

        const service = new QueryModelProjectionConsumerService(eventSourcingService, queryModelProjectionHandler);
        const transactionContext = { id: "tx" } as any;
        const context = {
            transactionContext,
            domainEvent: {
                getAggregateId: () => "aggregate-2"
            }
        } as any;

        await service.updateQueryModel(context);

        expect(queryModelProjectionHandler.deleteQueryModel).toHaveBeenCalledWith(transactionContext, "aggregate-2");
        expect(queryModelProjectionHandler.updateQueryModel).not.toHaveBeenCalled();
    });

    it("should update query model when aggregate exists and is not deleted", async () => {
        const aggregate = {
            isDeleted: () => false
        } as any;
        const aggregateContext = {
            build: vi.fn(async () => aggregate)
        } as any;
        const eventSourcingService = {
            createAggregateContext: vi.fn(() => aggregateContext)
        } as any;
        const queryModelProjectionHandler = {
            getAggregateClass: vi.fn(() => TestAggregate),
            updateQueryModel: vi.fn(async () => undefined),
            deleteQueryModel: vi.fn()
        } as any;

        const service = new QueryModelProjectionConsumerService(eventSourcingService, queryModelProjectionHandler);
        const transactionContext = { id: "tx" } as any;
        const context = {
            transactionContext,
            domainEvent: {
                getAggregateId: () => "aggregate-3"
            }
        } as any;

        await service.updateQueryModel(context);

        expect(queryModelProjectionHandler.updateQueryModel).toHaveBeenCalledWith(transactionContext, aggregate);
        expect(queryModelProjectionHandler.deleteQueryModel).not.toHaveBeenCalled();
    });
});
