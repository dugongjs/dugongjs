import type { AbstractDomainEvent } from "../abstract-domain-event/abstract-domain-event.js";
import type { ISerializedDomainEvent } from "../abstract-domain-event/i-serialized-domain-event.js";
import { domainEventRegistry } from "../domain-event-registry/domain-event-registry.js";

class DomainEventDeserializer {
    public deserializeDomainEvents(...serializedDomainEvents: ISerializedDomainEvent[]): AbstractDomainEvent<any>[] {
        return serializedDomainEvents
            .map((serializedDomainEvent) => {
                const domainEventClass = domainEventRegistry.getDomainEventClass(
                    serializedDomainEvent.origin,
                    serializedDomainEvent.aggregateType,
                    serializedDomainEvent.type,
                    serializedDomainEvent.version
                );

                if (!domainEventClass) {
                    return null;
                }

                const domainEvent = (domainEventClass as any).deserialize(
                    serializedDomainEvent
                ) as AbstractDomainEvent<any>;

                return domainEvent;
            })
            .filter((domainEvent) => !!domainEvent);
    }
}

export const domainEventDeserializer = new DomainEventDeserializer();
