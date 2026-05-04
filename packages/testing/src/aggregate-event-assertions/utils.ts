import {
    aggregateMetadataRegistry,
    type AbstractDomainEvent,
    type AggregateRoot,
    type DomainEventClass
} from "@dugongjs/core";

export function getAggregateName(aggregate: InstanceType<AggregateRoot>): string {
    return (
        aggregateMetadataRegistry.getAggregateMetadata(aggregate.constructor as AggregateRoot)?.type ||
        aggregate.constructor?.name ||
        "Aggregate"
    );
}

export function getDomainEventClassName<TDomainEventClass extends DomainEventClass<any>>(
    domainEventClass: TDomainEventClass
): string {
    return domainEventClass.type || domainEventClass.name || "DomainEvent";
}

export function describeDomainEvents(domainEvents: AbstractDomainEvent<any>[]): string {
    if (domainEvents.length === 0) {
        return "- none";
    }

    return domainEvents.map((domainEvent) => `- ${domainEvent.getType()}`).join("\n");
}
