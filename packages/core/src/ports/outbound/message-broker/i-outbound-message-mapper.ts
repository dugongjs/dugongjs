import type { SerializedDomainEvent } from "../../../domain/abstract-domain-event/serialized-domain-event.js";

/**
 * Common port interface for mapping outbound domain events to messages.
 */
export interface IOutboundMessageMapper<TMessage> {
    /**
     * Maps a domain event to a message.
     * The message is expected to be in a specific format that contains the necessary information to reconstruct the domain event.
     * @param domainEvent The domain event to be mapped.
     * @returns The message containing the domain event.
     */
    map(domainEvent: SerializedDomainEvent): TMessage;
}

export const IOutboundMessageMapper = "IOutboundMessageMapper" as const;
