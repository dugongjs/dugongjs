import type { SerializedDomainEvent } from "../../../domain/abstract-domain-event/serialized-domain-event.js";
import type { TenantScope } from "../../../domain/tenant-scope/tenant-scope.type.js";

/**
 * Options common to every aggregate query.
 */
export type AggregateQueryOptions = {
    /**
     * The tenant scope the query is made in. Omitting it states no tenancy, which is rejected when
     * the aggregate declares a tenancy mode or the application requires an explicit scope.
     */
    tenantScope?: TenantScope;
};

/**
 * Options for rebuilding a single aggregate.
 */
export type GetAggregateOptions = AggregateQueryOptions & {
    /**
     * The sequence number to build the aggregate up to (inclusive).
     */
    toSequenceNumber?: number;
};

/**
 * Common port interface for a query service that retrieves aggregates and domain events.
 */
export interface IAggregateQueryService {
    /**
     * Retrieves a list of supported aggregate types.
     * @returns A promise that resolves to an array of supported aggregate types.
     */
    getAggregateTypes(): Promise<string[]>;

    /**
     * Retrieves a list of aggregate IDs for a specific origin and aggregate type.
     * @param origin The origin of the aggregate (or null to use the current origin), used to uniquely identify the aggregate.
     * @param aggregateType The type of the aggregate, used to uniquely identify the aggregate.
     * @param options Options for the query, such as the tenant scope.
     * @returns A promise that resolves to an array of aggregate IDs.
     */
    getAggregateIds(origin: string | null, aggregateType: string, options?: AggregateQueryOptions): Promise<string[]>;

    /**
     * Retrieves an aggregate by its origin, type, and ID.
     * @param origin The origin of the aggregate (or null to use the current origin), used to uniquely identify the aggregate.
     * @param aggregateType The type of the aggregate, used to uniquely identify the aggregate.
     * @param aggregateId The ID of the aggregate, used to uniquely identify the aggregate.
     * @param options Options for the query, such as the tenant scope and the sequence number to build up to.
     * @returns A promise that resolves to the aggregate object, or null if not found.
     */
    getAggregate(
        origin: string | null,
        aggregateType: string,
        aggregateId: string,
        options?: GetAggregateOptions
    ): Promise<object | null>;

    /**
     * Retrieves a list of domain events for a specific aggregate.
     * @param origin The origin of the aggregate (or null to use the current origin), used to uniquely identify the aggregate.
     * @param aggregateType The type of the aggregate, used to uniquely identify the aggregate.
     * @param aggregateId The ID of the aggregate, used to uniquely identify the aggregate.
     * @param options Options for the query, such as the tenant scope.
     * @returns A promise that resolves to an array of serialized domain events.
     */
    getDomainEventsForAggregate(
        origin: string | null,
        aggregateType: string,
        aggregateId: string,
        options?: AggregateQueryOptions
    ): Promise<SerializedDomainEvent[]>;
}

export const IAggregateQueryService = "IAggregateQueryService" as const;
