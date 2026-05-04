import type { AggregateRoot } from "@dugongjs/core";
import { StagedEventsExistAssertionError } from "./errors/staged-events-exist-assertion.error.js";
import { describeDomainEvents, getAggregateName } from "./utils.js";

export function assertNoStagedEvents(aggregate: InstanceType<AggregateRoot>): void {
    const aggregateName = getAggregateName(aggregate);
    const stagedDomainEvents = aggregate.getStagedDomainEvents();

    if (stagedDomainEvents.length > 0) {
        throw new StagedEventsExistAssertionError(aggregateName, describeDomainEvents(stagedDomainEvents));
    }
}
