import type { AggregateRoot, DomainEventClass } from "@dugongjs/core";
import { MultipleStagedEventsFoundAssertionError } from "./errors/multiple-staged-events-found-assertion.error.js";
import { StagedEventNotFoundAssertionError } from "./errors/staged-event-not-found-assertion.error.js";
import { findStagedEvents } from "./find-staged-events.js";
import { describeDomainEvents, getAggregateName, getDomainEventClassName } from "./utils.js";

export function assertSingleStagedEvent<TDomainEventClass extends DomainEventClass<any>>(
    aggregate: InstanceType<AggregateRoot>,
    domainEventClass: TDomainEventClass
): InstanceType<TDomainEventClass> {
    const aggregateName = getAggregateName(aggregate);
    const domainEventClassName = getDomainEventClassName(domainEventClass);
    const stagedDomainEvents = aggregate.getStagedDomainEvents();
    const matchingDomainEvents = findStagedEvents(aggregate, domainEventClass);

    if (matchingDomainEvents.length === 0) {
        throw new StagedEventNotFoundAssertionError(
            aggregateName,
            domainEventClassName,
            describeDomainEvents(stagedDomainEvents),
            true
        );
    }

    if (matchingDomainEvents.length > 1) {
        throw new MultipleStagedEventsFoundAssertionError(
            aggregateName,
            domainEventClassName,
            matchingDomainEvents.length
        );
    }

    return matchingDomainEvents[0];
}
