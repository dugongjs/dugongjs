import type { TenantScope } from "@dugongjs/core";

export type AggregateQueryRequest = {
    origin: string | null;
    aggregateType: string;
    tenantScope?: TenantScope;
};

export type GetAggregateRequest = AggregateQueryRequest & {
    aggregateId: string;
    toSequenceNumber?: number;
};

export type GetDomainEventsForAggregateRequest = AggregateQueryRequest & {
    aggregateId: string;
};
