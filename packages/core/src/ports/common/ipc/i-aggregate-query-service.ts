import type { SerializedDomainEvent } from "../../../domain/abstract-domain-event/serialized-domain-event.js";

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
     * @param tenantId Optional tenant ID for multi-tenancy support, or null if not applicable.
     * @returns A promise that resolves to an array of aggregate IDs.
     */
    getAggregateIds(origin: string | null, aggregateType: string, tenantId?: string | null): Promise<string[]>;

    /**
     * Retrieves an aggregate by its origin, type, and ID.
     * @param origin The origin of the aggregate (or null to use the current origin), used to uniquely identify the aggregate.
     * @param aggregateType The type of the aggregate, used to uniquely identify the aggregate.
     * @param aggregateId The ID of the aggregate, used to uniquely identify the aggregate.
     * @param tenantId Optional tenant ID for multi-tenancy support, or null if not applicable.
     * @param toSequenceNumber The sequence number to build the aggregate up to (inclusive).
     * @returns A promise that resolves to the aggregate object, or null if not found.
     */
    getAggregate(
        origin: string | null,
        aggregateType: string,
        aggregateId: string,
        tenantId?: string | null,
        toSequenceNumber?: number
    ): Promise<object | null>;

    /**
     * Retrieves a list of domain events for a specific aggregate.
     * @param origin The origin of the aggregate (or null to use the current origin), used to uniquely identify the aggregate.
     * @param aggregateType The type of the aggregate, used to uniquely identify the aggregate.
     * @param aggregateId The ID of the aggregate, used to uniquely identify the aggregate.
     * @param tenantId Optional tenant ID for multi-tenancy support, or null if not applicable.
     * @returns A promise that resolves to an array of serialized domain events.
     */
    getDomainEventsForAggregate(
        origin: string | null,
        aggregateType: string,
        aggregateId: string,
        tenantId?: string | null
    ): Promise<SerializedDomainEvent[]>;
}

export const IAggregateQueryService = "IAggregateQueryService" as const;
