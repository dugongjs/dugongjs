import { mock } from "vitest-mock-extended";
import { AbstractAggregateRoot } from "../../domain/abstract-aggregate-root/abstract-aggregate-root.js";
import {
    aggregateMetadataRegistry,
    type AggregateMetadata,
    type AggregateTenancyMode
} from "../../domain/aggregate-metadata-registry/aggregate-metadata-registry.js";
import type { ITransactionManager } from "../../ports/outbound/transaction-manager/i-transaction-manager.js";
import { AbstractAggregateHandler, type AbstractAggregateHandlerOptions } from "./abstract-aggregate-handler.js";
import type { TenantScope } from "../tenant-scope/tenant-scope.type.js";
import { AggregateForbidsTenantScopeError } from "../tenant-scope/errors/aggregate-forbids-tenant-scope.error.js";
import { AggregateRequiresTenantScopeError } from "../tenant-scope/errors/aggregate-requires-tenant-scope.error.js";
import { TenantScopeNotSetError } from "../tenant-scope/errors/tenant-scope-not-set.error.js";

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
        aggregateMetadataRegistry.getAggregateTenancyMetadata = vi.fn(() => null);
        vi.clearAllMocks();
    });

    function declareTenancy(mode: AggregateTenancyMode | undefined) {
        aggregateMetadataRegistry.getAggregateTenancyMetadata = vi.fn(() => (mode ? { mode } : null));
    }

    const tenantScopes: Record<string, TenantScope | undefined> = {
        withTenantId: { type: "tenant", tenantId: "TestTenant" },
        withoutTenantId: { type: "unscoped" },
        omitted: undefined
    };

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

        it("should resolve an omitted scope to unscoped when the aggregate declares never", () => {
            declareTenancy("never");

            const handler = createHandler();

            expect(handler.getTenantScope()).toEqual({ type: "unscoped" });
            expect(handler.getTenantId()).toBeUndefined();
        });

        it("should leave an omitted scope unset when the aggregate declares always", () => {
            declareTenancy("always");

            const handler = createHandler();

            expect(handler.getTenantScope()).toBeUndefined();
        });

        it("should leave an omitted scope unset when the aggregate declares optional", () => {
            declareTenancy("optional");

            const handler = createHandler();

            expect(handler.getTenantScope()).toBeUndefined();
        });

        it("should resolve no tenant ID from an unscoped tenant scope", () => {
            const handler = createHandler({ tenantScope: { type: "unscoped" } });

            expect(handler.getTenantScope()).toEqual({ type: "unscoped" });
            expect(handler.getTenantId()).toBeUndefined();
        });
    });

    describe("assertTenantScopeIsSet", () => {
        type MatrixCase = {
            declares: AggregateTenancyMode | "nothing";
            requireTenantScope: boolean;
            callSite: keyof typeof tenantScopes;
            throws: "AggregateRequiresTenantScope" | "AggregateForbidsTenantScope" | "TenantScopeNotSet" | "nothing";
        };

        const errors = {
            AggregateRequiresTenantScope: AggregateRequiresTenantScopeError,
            AggregateForbidsTenantScope: AggregateForbidsTenantScopeError,
            TenantScopeNotSet: TenantScopeNotSetError
        };

        const matrix: MatrixCase[] = [
            { declares: "always", requireTenantScope: true, callSite: "withTenantId", throws: "nothing" },
            {
                declares: "always",
                requireTenantScope: true,
                callSite: "withoutTenantId",
                throws: "AggregateRequiresTenantScope"
            },
            {
                declares: "always",
                requireTenantScope: true,
                callSite: "omitted",
                throws: "AggregateRequiresTenantScope"
            },
            { declares: "always", requireTenantScope: false, callSite: "withTenantId", throws: "nothing" },
            {
                declares: "always",
                requireTenantScope: false,
                callSite: "withoutTenantId",
                throws: "AggregateRequiresTenantScope"
            },
            {
                declares: "always",
                requireTenantScope: false,
                callSite: "omitted",
                throws: "AggregateRequiresTenantScope"
            },

            {
                declares: "never",
                requireTenantScope: true,
                callSite: "withTenantId",
                throws: "AggregateForbidsTenantScope"
            },
            { declares: "never", requireTenantScope: true, callSite: "withoutTenantId", throws: "nothing" },
            { declares: "never", requireTenantScope: true, callSite: "omitted", throws: "nothing" },
            {
                declares: "never",
                requireTenantScope: false,
                callSite: "withTenantId",
                throws: "AggregateForbidsTenantScope"
            },
            { declares: "never", requireTenantScope: false, callSite: "withoutTenantId", throws: "nothing" },
            { declares: "never", requireTenantScope: false, callSite: "omitted", throws: "nothing" },

            { declares: "optional", requireTenantScope: true, callSite: "withTenantId", throws: "nothing" },
            { declares: "optional", requireTenantScope: true, callSite: "withoutTenantId", throws: "nothing" },
            { declares: "optional", requireTenantScope: true, callSite: "omitted", throws: "TenantScopeNotSet" },
            { declares: "optional", requireTenantScope: false, callSite: "withTenantId", throws: "nothing" },
            { declares: "optional", requireTenantScope: false, callSite: "withoutTenantId", throws: "nothing" },
            { declares: "optional", requireTenantScope: false, callSite: "omitted", throws: "TenantScopeNotSet" },

            { declares: "nothing", requireTenantScope: true, callSite: "withTenantId", throws: "nothing" },
            { declares: "nothing", requireTenantScope: true, callSite: "withoutTenantId", throws: "nothing" },
            { declares: "nothing", requireTenantScope: true, callSite: "omitted", throws: "TenantScopeNotSet" },
            { declares: "nothing", requireTenantScope: false, callSite: "withTenantId", throws: "nothing" },
            { declares: "nothing", requireTenantScope: false, callSite: "withoutTenantId", throws: "nothing" },
            { declares: "nothing", requireTenantScope: false, callSite: "omitted", throws: "nothing" }
        ];

        it.each(matrix)(
            "should throw $throws when the aggregate declares $declares, requireTenantScope is $requireTenantScope and the call site used $callSite",
            ({ declares, requireTenantScope, callSite, throws }) => {
                declareTenancy(declares === "nothing" ? undefined : declares);

                const handler = createHandler({ requireTenantScope, tenantScope: tenantScopes[callSite] });

                if (throws === "nothing") {
                    expect(() => handler.assertTenantScopeIsSet("testOperation")).not.toThrow();
                } else {
                    expect(() => handler.assertTenantScopeIsSet("testOperation")).toThrow(errors[throws]);
                }
            }
        );

        it("should cover every combination of declaration, flag and call site", () => {
            expect(matrix).toHaveLength(4 * 2 * 3);
        });
    });
});
