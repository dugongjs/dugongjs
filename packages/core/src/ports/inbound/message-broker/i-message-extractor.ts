import type { SerializedDomainEvent } from "../../../domain/abstract-domain-event/serialized-domain-event.js";

/**
 * Inbound port interface for extracting domain events from messages.
 */
export interface IMessageExtractor<TMessage> {
    /**
     * Extracts a domain event from a message.
     * The message is expected to be in a specific format that contains the necessary information to reconstruct the domain event.
     * @param message The message from which to extract the domain event.
     * @returns The extracted domain event, represented as an SerializedDomainEvent object.
     */
    extractSerializedDomainEventFromMessage(message: TMessage): SerializedDomainEvent;
}
