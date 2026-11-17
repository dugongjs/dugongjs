import type { AbstractDomainEvent } from "../abstract-domain-event/abstract-domain-event.js";
import type { SerializedDomainEvent } from "../abstract-domain-event/serialized-domain-event.js";
import { domainEventRegistry } from "../domain-event-registry/domain-event-registry.js";
import { domainEventUpcaster } from "../domain-event-upcaster/domain-event-upcaster.js";

class DomainEventDeserializer {
    public deserializeDomainEvents(...serializedDomainEvents: SerializedDomainEvent[]): AbstractDomainEvent<any>[] {
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

                return domainEventUpcaster.upcastDomainEvent(domainEvent);
            })
            .filter((domainEvent) => !!domainEvent);
    }
}

export const domainEventDeserializer = new DomainEventDeserializer();
