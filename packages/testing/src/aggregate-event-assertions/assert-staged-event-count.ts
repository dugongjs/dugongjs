import type { AggregateRoot } from "@dugongjs/core";
import { StagedEventCountMismatchAssertionError } from "./errors/staged-event-count-mismatch-assertion.error.js";
import { describeDomainEvents, getAggregateName } from "./utils.js";

export function assertStagedEventCount(aggregate: InstanceType<AggregateRoot>, expectedCount: number): void {
    const aggregateName = getAggregateName(aggregate);
    const stagedDomainEvents = aggregate.getStagedDomainEvents();

    if (stagedDomainEvents.length !== expectedCount) {
        throw new StagedEventCountMismatchAssertionError(
            aggregateName,
            expectedCount,
            stagedDomainEvents.length,
            describeDomainEvents(stagedDomainEvents)
        );
    }
}
