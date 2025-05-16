import type { SerializedDomainEvent } from "../../../domain/abstract-domain-event/serialized-domain-event.js";

/**
 * Common port interface for mapping Inbound domain events to messages.
 */
export interface IInboundMessageMapper<TMessage> {
    /**
     * Maps a message to a domain event.
     * The message is expected to be in a specific format that contains the necessary information to reconstruct the domain event.
     * @param message The message to be mapped.
     * @returns The domain event contained in the message.
     */
    map(message: TMessage): SerializedDomainEvent;
}

export const IInboundMessageMapper = "IInboundMessageMapper" as const;
