export class TenantScopeNotSetError extends Error {
    constructor(operation: string) {
        super(`"${operation}" requires an explicit tenant scope: call withTenantId() or withoutTenantId().`);
    }
}
