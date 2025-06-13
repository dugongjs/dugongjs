import type { TransactionContext } from "../transaction-manager/i-transaction-manager.js";

/**
 * Outbound port interface for a repository that manages the consumption status of messages.
 * A message refers to an event that has been published to a message broker.
 */
export interface IConsumedMessageRepository {
    /**
     * Checks if a message containing a domain event has already been consumed by a specific consumer.
     * - Must return true if the message has been consumed by the consumer, false otherwise.
     * @param transactionContext Transaction context for the operation, or null if not using transactions.
     * @param domainEventId The ID of the domain event contained in the message.
     * @param consumerId The ID of the consumer that is consuming the message.
     * @param tenantId Optional tenant ID for multi-tenancy support, or null if not applicable.
     */
    checkIfMessageIsConsumed(
        transactionContext: TransactionContext | null,
        domainEventId: string,
        consumerId: string,
        tenantId?: string | null
    ): Promise<boolean>;

    /**
     * Marks a message containing a domain event as consumed by a specific consumer.
     * - Must insert a new record in the database to indicate that the message has been consumed.
     * @param transactionContext Transaction context for the operation, or null if not using transactions.
     * @param domainEventId The ID of the domain event contained in the message.
     * @param consumerId The ID of the consumer that is consuming the message
     * @param tenantId Optional tenant ID for multi-tenancy support, or null if not applicable.
     */
    markMessageAsConsumed(
        transactionContext: TransactionContext | null,
        domainEventId: string,
        consumerId: string,
        tenantId?: string | null
    ): Promise<void>;
}

export const IConsumedMessageRepository = "IConsumedMessageRepository" as const;
