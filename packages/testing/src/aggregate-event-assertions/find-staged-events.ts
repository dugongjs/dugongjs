import type { AggregateRoot, DomainEventClass } from "@dugongjs/core";

export function findStagedEvents<TDomainEventClass extends DomainEventClass<any>>(
    aggregate: InstanceType<AggregateRoot>,
    domainEventClass: TDomainEventClass
): InstanceType<TDomainEventClass>[] {
    return aggregate
        .getStagedDomainEvents()
        .filter((domainEvent) => domainEvent instanceof domainEventClass) as InstanceType<TDomainEventClass>[];
}
