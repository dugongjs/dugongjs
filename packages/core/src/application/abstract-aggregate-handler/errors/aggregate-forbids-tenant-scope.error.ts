export class AggregateForbidsTenantScopeError extends Error {
    constructor(aggregateType: string, operation: string) {
        super(
            `"${operation}" on "${aggregateType}" cannot be scoped to a tenant, because the aggregate is declared @TenantScoped.Never().`
        );
    }
}
