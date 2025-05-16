import type { SerializedDomainEvent } from "../../../domain/abstract-domain-event/serialized-domain-event.js";
import type { IOutboundMessageMapper } from "../../../ports/outbound/message-broker/i-outbound-message-mapper.js";

export class OutboundMessageMapperInMemory implements IOutboundMessageMapper<SerializedDomainEvent> {
    public map(domainEvent: SerializedDomainEvent): SerializedDomainEvent {
        return domainEvent;
    }
}
