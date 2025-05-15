import type { SerializedDomainEvent } from "../../../domain/abstract-domain-event/serialized-domain-event.js";
import type { IMessageSerdes } from "../../../ports/common/message-broker/i-message-serdes.js";

export class MessageSerdesInMemory implements IMessageSerdes<SerializedDomainEvent, SerializedDomainEvent> {
    public wrapDomainEvent(domainEvent: SerializedDomainEvent): SerializedDomainEvent {
        return domainEvent;
    }

    public unwrapMessage(message: SerializedDomainEvent): SerializedDomainEvent {
        return message;
    }
}
