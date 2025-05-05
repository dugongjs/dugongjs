import type { SerializedDomainEvent } from "../../../domain/abstract-domain-event/serialized-domain-event.js";

/**
 * Common port interface for wrapping/unwrapping domain events to/from messages.
 */
export interface IMessageSerdes<TMessageIn, TMessageOut = TMessageIn> {
    /**
     * Wraps a domain event into a message.
     * The message is expected to be in a specific format that contains the necessary information to reconstruct the domain event.
     * @param domainEvent The domain event to be wrapped.
     * @returns The wrapped message.
     */
    wrapDomainEvent(domainEvent: SerializedDomainEvent): TMessageOut;

    /**
     * Unwraps a message into a domain event.
     * The message is expected to be in a specific format that contains the necessary information to reconstruct the domain event.
     * @param message The message to be unwrapped.
     * @returns The unwrapped domain event, represented as an SerializedDomainEvent object.
     */
    unwrapMessage(message: TMessageIn): SerializedDomainEvent;
}

export const IMessageSerdes = "IMessageSerdes" as const;
