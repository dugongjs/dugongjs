import type { SerializedDomainEvent } from "../../../domain/abstract-domain-event/serialized-domain-event.js";
import type { IInboundMessageMapper } from "../../../ports/inbound/message-broker/i-inbound-message-mapper.js";

export class InboundMessageMapperInMemory implements IInboundMessageMapper<SerializedDomainEvent> {
    public map(message: SerializedDomainEvent): SerializedDomainEvent {
        return message;
    }
}
