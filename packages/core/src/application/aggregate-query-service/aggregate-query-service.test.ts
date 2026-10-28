import { mock } from "vitest-mock-extended";
import { AbstractAggregateRoot } from "../../domain/abstract-aggregate-root/abstract-aggregate-root.js";
import { Aggregate, aggregateMetadataRegistry, TenantScoped } from "../../domain/index.js";
import type { IDomainEventRepository } from "../../ports/outbound/repository/i-domain-event-repository.js";
import { AggregateForbidsTenantScopeError } from "../tenant-scope/errors/aggregate-forbids-tenant-scope.error.js";
import { AggregateRequiresTenantScopeError } from "../tenant-scope/errors/aggregate-requires-tenant-scope.error.js";
import { TenantScopeNotSetError } from "../tenant-scope/errors/tenant-scope-not-set.error.js";
import { AggregateQueryService, type AggregateQueryServiceOptions } from "./aggregate-query-service.js";

@Aggregate("AlwaysScopedQueryAggregate")
@TenantScoped.Always()
class AlwaysScopedQueryAggregate extends AbstractAggregateRoot {}

@Aggregate("NeverScopedQueryAggregate")
@TenantScoped.Never()
class NeverScopedQueryAggregate extends AbstractAggregateRoot {}

@Aggregate("UndeclaredQueryAggregate")
class UndeclaredQueryAggregate extends AbstractAggregateRoot {}

describe("AggregateQueryService", () => {
    const mockDomainEventRepository = mock<IDomainEventRepository>();

    beforeEach(() => {
        vi.clearAllMocks();
        mockDomainEventRepository.getAggregateIds.mockResolvedValue([]);
        mockDomainEventRepository.getAggregateDomainEvents.mockResolvedValue([]);
    });

    function createService(overrides: Partial<AggregateQueryServiceOptions> = {}) {
        return new AggregateQueryService({
            currentOrigin: "CurrentOrigin",
            domainEventRepository: mockDomainEventRepository,
            ...overrides
        });
    }

    describe("aggregate registration", () => {
        it("should resolve the declared aggregates from the registry by type name", () => {
            expect(aggregateMetadataRegistry.getAggregateClass("AlwaysScopedQueryAggregate")).toBe(
                AlwaysScopedQueryAggregate
            );
            expect(aggregateMetadataRegistry.getAggregateClass("NeverScopedQueryAggregate")).toBe(
                NeverScopedQueryAggregate
            );
            expect(aggregateMetadataRegistry.getAggregateClass("UndeclaredQueryAggregate")).toBe(
                UndeclaredQueryAggregate
            );
        });
    });

    describe("getAggregateIds", () => {
        it("should reject an unscoped query when the aggregate declares always", async () => {
            await expect(
                createService().getAggregateIds("CurrentOrigin", "AlwaysScopedQueryAggregate")
            ).rejects.toThrow(AggregateRequiresTenantScopeError);
            expect(mockDomainEventRepository.getAggregateIds).not.toHaveBeenCalled();
        });

        it("should reject a tenant-scoped query when the aggregate declares never", async () => {
            await expect(
                createService().getAggregateIds("CurrentOrigin", "NeverScopedQueryAggregate", "TestTenant")
            ).rejects.toThrow(AggregateForbidsTenantScopeError);
            expect(mockDomainEventRepository.getAggregateIds).not.toHaveBeenCalled();
        });

        it("should allow a tenant-scoped query when the aggregate declares always", async () => {
            await expect(
                createService().getAggregateIds("CurrentOrigin", "AlwaysScopedQueryAggregate", "TestTenant")
            ).resolves.toEqual([]);
        });

        it("should pass the requested tenant ID through to the repository", async () => {
            await createService().getAggregateIds("CurrentOrigin", "AlwaysScopedQueryAggregate", "TestTenant");

            expect(mockDomainEventRepository.getAggregateIds).toHaveBeenCalledWith(
                null,
                "CurrentOrigin",
                "AlwaysScopedQueryAggregate",
                "TestTenant"
            );
        });

        it("should pass no tenant ID to the repository for an unscoped query", async () => {
            await createService().getAggregateIds("CurrentOrigin", "NeverScopedQueryAggregate");

            expect(mockDomainEventRepository.getAggregateIds).toHaveBeenCalledWith(
                null,
                "CurrentOrigin",
                "NeverScopedQueryAggregate",
                undefined
            );
        });

        it("should reject an unscoped query for an undeclared aggregate when a tenant scope is required", async () => {
            await expect(
                createService({ requireTenantScope: true }).getAggregateIds("CurrentOrigin", "UndeclaredQueryAggregate")
            ).rejects.toThrow(TenantScopeNotSetError);
        });

        it("should allow an unscoped query for an undeclared aggregate when no tenant scope is required", async () => {
            await expect(createService().getAggregateIds("CurrentOrigin", "UndeclaredQueryAggregate")).resolves.toEqual(
                []
            );
        });
    });

    describe("getDomainEventsForAggregate", () => {
        it("should reject an unscoped query when the aggregate declares always", async () => {
            await expect(
                createService().getDomainEventsForAggregate(
                    "CurrentOrigin",
                    "AlwaysScopedQueryAggregate",
                    "aggregate-1"
                )
            ).rejects.toThrow(AggregateRequiresTenantScopeError);
            expect(mockDomainEventRepository.getAggregateDomainEvents).not.toHaveBeenCalled();
        });

        it("should reject a tenant-scoped query when the aggregate declares never", async () => {
            await expect(
                createService().getDomainEventsForAggregate(
                    "CurrentOrigin",
                    "NeverScopedQueryAggregate",
                    "aggregate-1",
                    "TestTenant"
                )
            ).rejects.toThrow(AggregateForbidsTenantScopeError);
        });

        it("should allow a tenant-scoped query when the aggregate declares always", async () => {
            await expect(
                createService().getDomainEventsForAggregate(
                    "CurrentOrigin",
                    "AlwaysScopedQueryAggregate",
                    "aggregate-1",
                    "TestTenant"
                )
            ).resolves.toEqual([]);
        });

        it("should pass the requested tenant ID through to the repository", async () => {
            await createService().getDomainEventsForAggregate(
                "CurrentOrigin",
                "AlwaysScopedQueryAggregate",
                "aggregate-1",
                "TestTenant"
            );

            expect(mockDomainEventRepository.getAggregateDomainEvents).toHaveBeenCalledWith(
                null,
                "CurrentOrigin",
                "AlwaysScopedQueryAggregate",
                "aggregate-1",
                "TestTenant"
            );
        });
    });

    describe("getAggregate", () => {
        it("should reject an unscoped query when the aggregate declares always", async () => {
            await expect(
                createService().getAggregate("CurrentOrigin", "AlwaysScopedQueryAggregate", "aggregate-1")
            ).rejects.toThrow(AggregateRequiresTenantScopeError);
        });

        it("should reject a tenant-scoped query when the aggregate declares never", async () => {
            await expect(
                createService().getAggregate("CurrentOrigin", "NeverScopedQueryAggregate", "aggregate-1", "TestTenant")
            ).rejects.toThrow(AggregateForbidsTenantScopeError);
        });
    });

    describe("origin resolution", () => {
        it("should enforce the declaration when the caller names this service's own origin", async () => {
            await expect(
                createService().getAggregateIds("CurrentOrigin", "AlwaysScopedQueryAggregate")
            ).rejects.toThrow(AggregateRequiresTenantScopeError);
        });

        it("should enforce the declaration when the caller omits the origin", async () => {
            await expect(createService().getAggregateIds(null, "AlwaysScopedQueryAggregate")).rejects.toThrow(
                AggregateRequiresTenantScopeError
            );
        });

        it("should enforce the declaration when the caller names an unrelated origin", async () => {
            await expect(
                createService().getAggregateIds("SomeOtherOrigin", "AlwaysScopedQueryAggregate")
            ).rejects.toThrow(AggregateRequiresTenantScopeError);
        });
    });

    describe("getAggregateTypes", () => {
        it("should not require a tenant scope, since it reads no aggregate data", async () => {
            await expect(createService({ requireTenantScope: true }).getAggregateTypes()).resolves.toContain(
                "AlwaysScopedQueryAggregate"
            );
        });
    });
});
