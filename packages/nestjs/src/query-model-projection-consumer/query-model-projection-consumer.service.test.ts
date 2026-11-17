import { AbstractAggregateRoot, Aggregate } from "@dugongjs/core";
import { Module } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import "reflect-metadata";
import { describe, expect, it, vi } from "vitest";
import { repositoryInMemoryAdapter } from "../adapters/repository-in-memory.adapter.js";
import { transactionManagerInMemoryAdapter } from "../adapters/transaction-manager-in-memory.adapter.js";
import { DugongAdapterBuilder } from "../dugong/dugong-adapter.js";
import { DugongModule } from "../dugong/dugong.module.js";
import { EventSourcingModule } from "../event-sourcing/event-sourcing.module.js";
import { IQueryModelProjectionHandler } from "./i-query-model-projection-handler.js";
import { QueryModelProjectionConsumerService } from "./query-model-projection-consumer.service.js";

class TestAggregate {}

@Aggregate("TenantScopeProbeAggregate")
class TenantScopeProbeAggregate extends AbstractAggregateRoot {}

async function createAppWithTenantScopeRequired() {
    @Module({
        imports: [
            DugongModule.forRoot({
                currentOrigin: "TestOrigin",
                requireTenantScope: true,
                adapters: new DugongAdapterBuilder()
                    .registerMany(repositoryInMemoryAdapter, transactionManagerInMemoryAdapter)
                    .build()
            }),
            EventSourcingModule
        ],
        providers: [
            QueryModelProjectionConsumerService,
            {
                provide: IQueryModelProjectionHandler,
                useValue: {
                    getAggregateClass: () => TenantScopeProbeAggregate,
                    updateQueryModel: vi.fn(async () => undefined),
                    deleteQueryModel: vi.fn(async () => undefined)
                }
            }
        ]
    })
    class TestModule {}

    const app = await Test.createTestingModule({ imports: [TestModule] }).compile();

    await app.init();

    return app;
}

const defaultTransactionContext = { id: "tx" } as any;

function makeAggregate(overrides: { isDeleted?: boolean } = {}) {
    return { isDeleted: vi.fn(() => overrides.isDeleted ?? false) } as any;
}

function makeAggregateContext(aggregate: any, derivedContext?: any) {
    return {
        build: vi.fn(async () => aggregate),
        withTenantId: vi.fn(() => derivedContext ?? makeAggregateContext(aggregate)),
        withoutTenantId: vi.fn(() => derivedContext ?? makeAggregateContext(aggregate))
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
        const unscopedAggregateContext = makeAggregateContext(null);
        const aggregateContext = makeAggregateContext(null, unscopedAggregateContext);
        const eventSourcingService = makeEventSourcingService(aggregateContext);
        const queryModelProjectionHandler = makeProjectionHandler();

        const service = new QueryModelProjectionConsumerService(eventSourcingService, queryModelProjectionHandler);

        await service.updateQueryModel(makeHandleMessageContext("aggregate-1"));

        expect(eventSourcingService.createAggregateContext).toHaveBeenCalledWith(
            defaultTransactionContext,
            TestAggregate
        );
        expect(unscopedAggregateContext.build).toHaveBeenCalledWith("aggregate-1", { returnDeleted: true });
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

    it("should declare the aggregate context unscoped when the domain event has no tenant ID", async () => {
        const aggregate = makeAggregate();
        const unscopedAggregateContext = makeAggregateContext(aggregate);
        const aggregateContext = makeAggregateContext(aggregate, unscopedAggregateContext);
        const eventSourcingService = makeEventSourcingService(aggregateContext);
        const queryModelProjectionHandler = makeProjectionHandler();

        const service = new QueryModelProjectionConsumerService(eventSourcingService, queryModelProjectionHandler);

        await service.updateQueryModel(makeHandleMessageContext("aggregate-5"));

        expect(aggregateContext.withoutTenantId).toHaveBeenCalled();
        expect(aggregateContext.withTenantId).not.toHaveBeenCalled();
        expect(unscopedAggregateContext.build).toHaveBeenCalledWith("aggregate-5", { returnDeleted: true });
    });

    it("should project an untenanted domain event when the application requires a tenant scope", async () => {
        const app = await createAppWithTenantScopeRequired();
        const service = app.get(QueryModelProjectionConsumerService);

        await expect(
            service.updateQueryModel(makeHandleMessageContext("11111111-1111-1111-1111-111111111111", undefined, null))
        ).resolves.toBeUndefined();

        await app.close();
    });
});
