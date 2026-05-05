import "reflect-metadata";
import { describe, expect, it, vi } from "vitest";
import { QueryModelProjectionConsumerService } from "./query-model-projection-consumer.service.js";

class TestAggregate {}

const defaultTransactionContext = { id: "tx" } as any;

function makeAggregate(overrides: { isDeleted?: boolean } = {}) {
    return { isDeleted: vi.fn(() => overrides.isDeleted ?? false) } as any;
}

function makeAggregateContext(aggregate: any, tenantScopedContext?: any) {
    return {
        build: vi.fn(async () => aggregate),
        withTenantId: vi.fn(() => tenantScopedContext ?? makeAggregateContext(aggregate))
    } as any;
}

function makeEventSourcingService(aggregateContext: any) {
    return { createAggregateContext: vi.fn(() => aggregateContext) } as any;
}

function makeProjectionHandler(overrides: { updateQueryModel?: any; deleteQueryModel?: any } = {}) {
    return {
        getAggregateClass: vi.fn(() => TestAggregate),
        updateQueryModel: overrides.updateQueryModel ?? vi.fn(async () => undefined),
        deleteQueryModel: overrides.deleteQueryModel ?? vi.fn(async () => undefined)
    } as any;
}

function makeDomainEvent(aggregateId: string, tenantId?: string) {
    return {
        getAggregateId: () => aggregateId,
        getTenantId: () => tenantId
    } as any;
}

function makeHandleMessageContext(
    aggregateId: string,
    tenantId?: string,
    transactionContext = defaultTransactionContext
) {
    return {
        transactionContext,
        domainEvent: makeDomainEvent(aggregateId, tenantId)
    } as any;
}

describe("QueryModelProjectionConsumerService", () => {
    it("should delegate getAggregateClass to projection handler", () => {
        const eventSourcingService = makeEventSourcingService(makeAggregateContext(null));
        const queryModelProjectionHandler = makeProjectionHandler();

        const service = new QueryModelProjectionConsumerService(eventSourcingService, queryModelProjectionHandler);

        expect(service.getAggregateClass()).toBe(TestAggregate);
        expect(queryModelProjectionHandler.getAggregateClass).toHaveBeenCalledTimes(1);
    });

    it("should do nothing when aggregate cannot be built", async () => {
        const aggregateContext = makeAggregateContext(null);
        const eventSourcingService = makeEventSourcingService(aggregateContext);
        const queryModelProjectionHandler = makeProjectionHandler();

        const service = new QueryModelProjectionConsumerService(eventSourcingService, queryModelProjectionHandler);

        await service.updateQueryModel(makeHandleMessageContext("aggregate-1"));

        expect(eventSourcingService.createAggregateContext).toHaveBeenCalledWith(
            defaultTransactionContext,
            TestAggregate
        );
        expect(aggregateContext.build).toHaveBeenCalledWith("aggregate-1", { returnDeleted: true });
        expect(queryModelProjectionHandler.updateQueryModel).not.toHaveBeenCalled();
        expect(queryModelProjectionHandler.deleteQueryModel).not.toHaveBeenCalled();
    });

    it("should delete query model when aggregate is deleted", async () => {
        const aggregate = makeAggregate({ isDeleted: true });
        const aggregateContext = makeAggregateContext(aggregate);
        const eventSourcingService = makeEventSourcingService(aggregateContext);
        const queryModelProjectionHandler = makeProjectionHandler();

        const service = new QueryModelProjectionConsumerService(eventSourcingService, queryModelProjectionHandler);

        await service.updateQueryModel(makeHandleMessageContext("aggregate-2"));

        expect(queryModelProjectionHandler.deleteQueryModel).toHaveBeenCalledWith(
            defaultTransactionContext,
            "aggregate-2"
        );
        expect(queryModelProjectionHandler.updateQueryModel).not.toHaveBeenCalled();
    });

    it("should update query model when aggregate exists and is not deleted", async () => {
        const aggregate = makeAggregate();
        const aggregateContext = makeAggregateContext(aggregate);
        const eventSourcingService = makeEventSourcingService(aggregateContext);
        const queryModelProjectionHandler = makeProjectionHandler();

        const service = new QueryModelProjectionConsumerService(eventSourcingService, queryModelProjectionHandler);

        await service.updateQueryModel(makeHandleMessageContext("aggregate-3"));

        expect(queryModelProjectionHandler.updateQueryModel).toHaveBeenCalledWith(defaultTransactionContext, aggregate);
        expect(queryModelProjectionHandler.deleteQueryModel).not.toHaveBeenCalled();
    });

    it("should pass tenant ID from domain event to the aggregate context", async () => {
        const aggregate = makeAggregate();
        const tenantScopedAggregateContext = makeAggregateContext(aggregate);
        const aggregateContext = makeAggregateContext(aggregate, tenantScopedAggregateContext);
        const eventSourcingService = makeEventSourcingService(aggregateContext);
        const queryModelProjectionHandler = makeProjectionHandler();

        const service = new QueryModelProjectionConsumerService(eventSourcingService, queryModelProjectionHandler);

        await service.updateQueryModel(makeHandleMessageContext("aggregate-4", "tenant-a"));

        expect(aggregateContext.withTenantId).toHaveBeenCalledWith("tenant-a");
        expect(tenantScopedAggregateContext.build).toHaveBeenCalledWith("aggregate-4", { returnDeleted: true });
        expect(queryModelProjectionHandler.updateQueryModel).toHaveBeenCalledWith(defaultTransactionContext, aggregate);
    });
});
