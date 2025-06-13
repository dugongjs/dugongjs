import type { SerializedDomainEvent } from "../../../domain/abstract-domain-event/serialized-domain-event.js";
import type { TransactionContext } from "../transaction-manager/i-transaction-manager.js";

/**
 * Outbound port interface for a repository that manages domain events.
 */
export interface IDomainEventRepository {
    /**
     * Retrieves a list of domain events for a specific aggregate.
     * - Must return all domain events for the given aggregate type and ID.
     * - Must return an empty array if no events are found.
     * @param transactionContext Transaction context for the operation, or null if not using transactions.
     * @param origin The origin of the aggregate, used to uniquely identify the aggregate.
     * @param aggregateType The type of the aggregate, used to uniquely identify the aggregate.
     * @param aggregateId The ID of the aggregate, used to uniquely identify the aggregate.
     * @param tenantId Optional tenant ID for multi-tenancy support, or null if not applicable.
     * @param fromSequenceNumber The sequence number to start retrieving events from (inclusive).
     * @returns A promise that resolves to an array of serialized domain events.
     */
    getAggregateDomainEvents(
        transactionContext: TransactionContext | null,
        origin: string,
        aggregateType: string,
        aggregateId: string,
        tenantId?: string | null,
        fromSequenceNumber?: number
    ): Promise<SerializedDomainEvent[]>;

    /**
     * Retrieves all aggregate IDs for a specific origin and aggregate type.
     * @param transactionContext Transaction context for the operation, or null if not using transactions.
     * @param origin The origin of the aggregate, used to uniquely identify the aggregate.
     * @param aggregateType The type of the aggregate, used to uniquely identify the aggregate.
     * @param tenantId Optional tenant ID for multi-tenancy support, or null if not applicable.
     * @returns A promise that resolves to an array of aggregate IDs.
     */
    getAggregateIds(
        transactionContext: TransactionContext | null,
        origin: string,
        aggregateType: string,
        tenantId?: string | null
    ): Promise<string[]>;

    /**
     * Saves a list of domain events to the repository.
     * - Must insert the events into the database.
     * - Must throw an error if there is a conflict with the event ID.
     * - Must throw an error if there is a conflict with the composite [origin, aggregateType, aggregateId, sequenceNumber] to ensure optimistic concurrency.
     * @param transactionContext Transaction context for the operation, or null if not using transactions.
     * @param events The list of serialized domain events to save.
     */
    saveDomainEvents(transactionContext: TransactionContext | null, events: SerializedDomainEvent[]): Promise<void>;
}

export const IDomainEventRepository = "IDomainEventRepository" as const;
