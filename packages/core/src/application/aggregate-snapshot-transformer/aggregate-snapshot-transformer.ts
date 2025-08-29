import { instanceToPlain, plainToInstance } from "class-transformer";
import type { AbstractAggregateRoot } from "../../domain/abstract-aggregate-root/abstract-aggregate-root.js";
import type { EventSourcedAggregateRoot } from "../../domain/abstract-event-sourced-aggregate-root/event-sourced-aggregate-root.js";
import type { SerializedSnapshot } from "../../ports/outbound/repository/i-snapshot-repository.js";

class AggregateSnapshotTransformer {
    public takeSnapshot(
        origin: string,
        aggregateType: string,
        aggregate: InstanceType<typeof AbstractAggregateRoot>,
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
}

export const aggregateSnapshotTransformer = new AggregateSnapshotTransformer();
