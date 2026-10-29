import type { AggregateTenancyMode } from "../../domain/aggregate-metadata-registry/aggregate-metadata-registry.js";
import { AggregateForbidsTenantScopeError } from "./errors/aggregate-forbids-tenant-scope.error.js";
import { AggregateRequiresTenantScopeError } from "./errors/aggregate-requires-tenant-scope.error.js";
import { TenantScopeNotSetError } from "./errors/tenant-scope-not-set.error.js";
import type { TenantScope } from "../../domain/tenant-scope/tenant-scope.type.js";

export type TenantScopeAssertion = {
    aggregateType: string;
    operation: string;
    tenancyMode: AggregateTenancyMode | undefined;
    tenantScope: TenantScope | undefined;
    requireTenantScope: boolean;
};

class TenantScopeResolver {
    public resolve(
        tenantScope: TenantScope | undefined,
        tenancyMode: AggregateTenancyMode | undefined
    ): TenantScope | undefined {
        if (!tenantScope && tenancyMode === "never") {
            return { type: "unscoped" };
        }

        return tenantScope;
    }

    public toTenantId(tenantScope: TenantScope | undefined): string | undefined {
        return tenantScope?.type === "tenant" ? tenantScope.tenantId : undefined;
    }

    public assert(assertion: TenantScopeAssertion): void {
        const { aggregateType, operation, tenancyMode, tenantScope, requireTenantScope } = assertion;

        if (tenancyMode === "always") {
            if (tenantScope?.type !== "tenant") {
                throw new AggregateRequiresTenantScopeError(aggregateType, operation);
            }

            return;
        }

        if (tenancyMode === "never") {
            if (tenantScope?.type === "tenant") {
                throw new AggregateForbidsTenantScopeError(aggregateType, operation);
            }

            return;
        }

        if (!tenantScope && (tenancyMode === "optional" || requireTenantScope)) {
            throw new TenantScopeNotSetError(operation);
        }
    }
}

export const tenantScopeResolver = new TenantScopeResolver();
