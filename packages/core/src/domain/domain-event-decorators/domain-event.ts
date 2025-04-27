import { domainEventRegistry } from "../domain-event-registry/domain-event-registry.js";

/**
 * Decorator to register a class as a domain event.
 */
export function DomainEvent(): ClassDecorator {
    return (target: any) => {
        domainEventRegistry.register(target);
    };
}
