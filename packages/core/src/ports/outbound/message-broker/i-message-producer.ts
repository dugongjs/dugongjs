import type { SerializedDomainEvent } from "../../../domain/abstract-domain-event/serialized-domain-event.js";
import type { IMessageChannelParticipant } from "../../common/message-broker/i-message-channel-participant.js";
import type { TransactionContext } from "../transaction-manager/i-transaction-manager.js";

/**
 * Outbound port interface for a message producer.
 */
export interface IMessageProducer extends IMessageChannelParticipant {
    /**
     * Publishes domain events as messages to a message broker.
     * The transaction context is provided in order to allow a transaction log miner to act as a message producer.
     * This is necessary to ensure complete transactional consistency.
     * @param transactionContext Transaction context for the operation, or null if not using transactions.
     * @param events The domain events to be published.
     * @param messageChannelId The ID of the message channel to which the events will be published.
     */
    publishDomainEventsAsMessages(
        transactionContext: TransactionContext | null,
        domainEvents: SerializedDomainEvent[],
        messageChannelId: string
    ): Promise<void>;
}
