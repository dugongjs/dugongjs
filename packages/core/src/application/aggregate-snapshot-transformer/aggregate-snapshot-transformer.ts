import { instanceToPlain, plainToInstance } from "class-transformer";
import equal from "fast-deep-equal";
import type { EventSourcedAggregateRoot } from "../../domain/abstract-event-sourced-aggregate-root/event-sourced-aggregate-root.js";
import type { SerializedSnapshot } from "../../ports/outbound/repository/i-snapshot-repository.js";

class AggregateSnapshotTransformer {
    public takeSnapshot(
        origin: string,
        aggregateType: string,
        aggregate: InstanceType<EventSourcedAggregateRoot>,
        tenantId?: string | null
    ): SerializedSnapshot {
        const aggregateSnapshot = instanceToPlain(aggregate);

        return {
            origin: origin,
            aggregateType: aggregateType,
            aggregateId: aggregate.getId(),
            tenantId: tenantId,
            domainEventSequenceNumber: aggregate.getCurrentDomainEventSequenceNumber(),
            snapshotData: aggregateSnapshot
        };
    }

    public restoreFromSnapshot<TAggregateRootClass extends EventSourcedAggregateRoot>(
        aggregateClass: TAggregateRootClass,
        snapshot: SerializedSnapshot
    ): InstanceType<TAggregateRootClass> {
        const { aggregateId, domainEventSequenceNumber, snapshotData } = snapshot;

        const aggregate = plainToInstance(aggregateClass, snapshotData);
        if (!aggregate.getId()) {
            aggregate.setId(aggregateId);
        }
        aggregate.setCurrentDomainEventSequenceNumber(domainEventSequenceNumber);

        return aggregate as InstanceType<TAggregateRootClass>;
    }

    public canBeRestoredFromSnapshot<TAggregateRootClass extends EventSourcedAggregateRoot>(
        aggregateClass: TAggregateRootClass,
        aggregate: InstanceType<TAggregateRootClass>
    ): {
        snapshot: any;
        restored: any;
        isEqual: boolean;
    } {
        const snapshot = JSON.parse(JSON.stringify(instanceToPlain(aggregate)));
        const restored = plainToInstance(aggregateClass, snapshot);
        const isEqual = equal(aggregate, restored);

        return { snapshot, restored, isEqual };
    }
}

export const aggregateSnapshotTransformer = new AggregateSnapshotTransformer();
