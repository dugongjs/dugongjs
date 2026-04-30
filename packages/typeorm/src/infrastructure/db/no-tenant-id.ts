export const NO_TENANT_ID = "__dugongjs_no_tenant__";

export function normalizeTenantId(tenantId?: string | null): string {
    return tenantId ?? NO_TENANT_ID;
}

export function denormalizeTenantId(tenantId?: string | null): string | undefined {
    return tenantId === NO_TENANT_ID ? undefined : (tenantId ?? undefined);
}
