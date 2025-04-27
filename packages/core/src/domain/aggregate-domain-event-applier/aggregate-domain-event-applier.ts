import type { Constructor } from "../../types/constructor.type.js";
import type { AbstractAggregateRoot } from "../abstract-aggregate-root/abstract-aggregate-root.js";
import type { AbstractDomainEvent } from "../abstract-domain-event/abstract-domain-event.js";
import type { AbstractEventSourcedAggregateRoot } from "../abstract-event-sourced-aggregate-root/abstract-event-sourced-aggregate-root.js";
import { aggregateMetadataRegistry } from "../aggregate-metadata-registry/aggregate-metadata-registry.js";
import { AggregateIdMismatchError } from "./errors/aggregate-id-mismatch.error.js";
import { DomainEventSequenceNumberMismatchError } from "./errors/domain-event-sequence-number-mismatch.error.js";

class AggregateDomainEventApplier {
    public applyDomainEventToAggregate(
        aggregate: InstanceType<typeof AbstractEventSourcedAggregateRoot>,
        domainEvent: InstanceType<typeof AbstractDomainEvent>
    ): InstanceType<typeof AbstractEventSourcedAggregateRoot> {
        const domainEventSequenceNumber = domainEvent.getSequenceNumber();
        const aggregateSequenceNumber = aggregate.getCurrentDomainEventSequenceNumber();
        const nextAggregateEventSequenceNumber = aggregateSequenceNumber + 1;

        if (domainEventSequenceNumber !== nextAggregateEventSequenceNumber) {
            throw new DomainEventSequenceNumberMismatchError(
                aggregate.getId(),
                nextAggregateEventSequenceNumber,
                domainEventSequenceNumber
            );
        }

        aggregate.setCurrentDomainEventSequenceNumber(domainEventSequenceNumber);

        if (!aggregate.getId()) {
            aggregate.setId(domainEvent.getAggregateId());
        } else if (aggregate.getId() !== domainEvent.getAggregateId()) {
            throw new AggregateIdMismatchError(aggregate.getId(), domainEvent.getAggregateId());
        }

        const appliers = aggregateMetadataRegistry.getAggregateDomainEventAppliers(
            aggregate.constructor as Constructor,
            domainEvent.constructor as Constructor
        );

        if (!appliers || appliers.length === 0) {
            return aggregate;
        }

        for (const applier of appliers) {
            applier.call(aggregate, domainEvent);
        }

        return aggregate;
    }

    public applyStagedDomainEventsToAggregate(
        aggregate: InstanceType<typeof AbstractAggregateRoot>
    ): InstanceType<typeof AbstractAggregateRoot> {
        const stagedDomainEvents = aggregate.getStagedDomainEvents();

        for (const domainEvent of stagedDomainEvents) {
            this.applyDomainEventToAggregate(aggregate, domainEvent);
        }

        return aggregate;
    }
}

export const aggregateDomainEventApplier = new AggregateDomainEventApplier();
