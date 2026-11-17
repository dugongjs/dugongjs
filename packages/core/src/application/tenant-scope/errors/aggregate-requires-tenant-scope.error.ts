export class AggregateRequiresTenantScopeError extends Error {
    constructor(aggregateType: string, operation: string) {
        super(
            `"${operation}" on "${aggregateType}" requires a tenant, because the aggregate is declared @TenantScoped.Always().`
        );
    }
}
