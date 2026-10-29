import type { TenantScope } from "@dugongjs/core";

export type TenantScopeOptions = {
    tenantId?: string;
};

export function resolveTenantScope(options: TenantScopeOptions): TenantScope {
    return options.tenantId ? { type: "tenant", tenantId: options.tenantId } : { type: "unscoped" };
}
