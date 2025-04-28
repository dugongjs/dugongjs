import type { SerializedDomainEvent } from "../../../domain/abstract-domain-event/serialized-domain-event.js";
import type { TransactionContext } from "../transaction-manager/i-transaction-manager.js";

/**
 * Outbound port interface for a repository that manages domain events.
 */
export interface IDomainEventRepository {
    /**
     * Retrieves a list of domain events for a specific aggregate.
     * MUST return all domain events for the given aggregate type and ID.
     * MUST return an empty array if no events are found.
     * @param transactionContext Transaction context for the operation, or null if not using transactions.
     * @param origin The origin of the aggregate, used to uniquely identify the aggregate.
     * @param aggregateType The type of the aggregate, used to uniquely identify the aggregate.
     * @param aggregateId The ID of the aggregate, used to uniquely identify the aggregate.
     * @param fromSequenceNumber The sequence number to start retrieving events from (inclusive).
     */
    getAggregateDomainEvents(
        transactionContext: TransactionContext | null,
        origin: string,
        aggregateType: string,
        aggregateId: string,
        fromSequenceNumber?: number
    ): Promise<SerializedDomainEvent[]>;

    /**
     * Saves a list of domain events to the repository.
     * MUST insert the events into the database.
     * MUST throw an error if there is a conflict with the event ID.
     * MUST throw an error if there is a conflict with the composite [origin, aggregateType, aggregateId, sequenceNumber] to ensure optimistic concurrency.
     * @param transactionContext
     * @param events
     */
    saveDomainEvents(transactionContext: TransactionContext | null, events: SerializedDomainEvent[]): Promise<void>;
}

export const IDomainEventRepository = "IDomainEventRepository" as const;
