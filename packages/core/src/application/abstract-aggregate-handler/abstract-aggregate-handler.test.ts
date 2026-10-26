import { mock } from "vitest-mock-extended";
import { AbstractAggregateRoot } from "../../domain/abstract-aggregate-root/abstract-aggregate-root.js";
import {
    aggregateMetadataRegistry,
    type AggregateMetadata
} from "../../domain/aggregate-metadata-registry/aggregate-metadata-registry.js";
import type { ITransactionManager } from "../../ports/outbound/transaction-manager/i-transaction-manager.js";
import { AbstractAggregateHandler, type AbstractAggregateHandlerOptions } from "./abstract-aggregate-handler.js";
import { TenantScopeNotSetError } from "./errors/tenant-scope-not-set.error.js";

describe("AbstractAggregateHandler", () => {
    class MockAggregate extends AbstractAggregateRoot {}
    class MockAggregateHandler extends AbstractAggregateHandler<typeof MockAggregate> {
        // Make them public for testing
        public getTenantScope() {
            return this.tenantScope;
        }

        public getTenantId() {
            return this.tenantId;
        }

        public assertTenantScopeIsSet(operation: string): void {
            return super.assertTenantScopeIsSet(operation);
        }
    }

    const mockTransactionManager = mock<ITransactionManager>({
        transaction: (fn) => fn({})
    });

    const aggregateMetadata: AggregateMetadata = {
        isInternal: false,
        origin: "TestOrigin",
        type: "TestType"
    };

    beforeEach(() => {
        aggregateMetadataRegistry.getAggregateMetadata = vi.fn(() => aggregateMetadata);
        aggregateMetadataRegistry.getAggregateSnapshotMetadata = vi.fn(() => null);
        vi.clearAllMocks();
    });

    function createHandler(overrides: Partial<AbstractAggregateHandlerOptions<typeof MockAggregate>> = {}) {
        return new MockAggregateHandler({
            aggregateClass: MockAggregate,
            transactionManager: mockTransactionManager,
            currentOrigin: "CurrentOrigin",
            ...overrides
        });
    }

    describe("constructor", () => {
        it("should leave the tenant scope undefined when none is given", () => {
            const handler = createHandler();

            expect(handler.getTenantScope()).toBeUndefined();
            expect(handler.getTenantId()).toBeUndefined();
        });

        it("should resolve the tenant ID from a tenant scope", () => {
            const handler = createHandler({ tenantScope: { type: "tenant", tenantId: "TestTenant" } });

            expect(handler.getTenantScope()).toEqual({ type: "tenant", tenantId: "TestTenant" });
            expect(handler.getTenantId()).toBe("TestTenant");
        });

        it("should resolve no tenant ID from an unscoped tenant scope", () => {
            const handler = createHandler({ tenantScope: { type: "unscoped" } });

            expect(handler.getTenantScope()).toEqual({ type: "unscoped" });
            expect(handler.getTenantId()).toBeUndefined();
        });
    });

    describe("assertTenantScopeIsSet", () => {
        it("should not throw when a tenant scope is not required", () => {
            const handler = createHandler();

            expect(() => handler.assertTenantScopeIsSet("testOperation")).not.toThrow();
        });

        it("should throw TenantScopeNotSetError when required and no scope has been set", () => {
            const handler = createHandler({ requireTenantScope: true });

            expect(() => handler.assertTenantScopeIsSet("testOperation")).toThrow(TenantScopeNotSetError);
        });

        it("should name the operation in the error", () => {
            const handler = createHandler({ requireTenantScope: true });

            expect(() => handler.assertTenantScopeIsSet("testOperation")).toThrow(/"testOperation"/);
        });

        it("should not throw when required and scoped to a tenant", () => {
            const handler = createHandler({
                requireTenantScope: true,
                tenantScope: { type: "tenant", tenantId: "TestTenant" }
            });

            expect(() => handler.assertTenantScopeIsSet("testOperation")).not.toThrow();
        });

        it("should not throw when required and explicitly unscoped", () => {
            const handler = createHandler({ requireTenantScope: true, tenantScope: { type: "unscoped" } });

            expect(() => handler.assertTenantScopeIsSet("testOperation")).not.toThrow();
        });
    });
});
