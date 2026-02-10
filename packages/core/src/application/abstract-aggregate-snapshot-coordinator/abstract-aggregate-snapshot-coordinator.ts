import type { EventSourcedAggregateRoot } from "../../domain/abstract-event-sourced-aggregate-root/event-sourced-aggregate-root.js";
import type { ISnapshotRepository } from "../../ports/outbound/repository/i-snapshot-repository.js";
import {
    AbstractAggregateHandler,
    type AbstractAggregateHandlerOptions
} from "../abstract-aggregate-handler/abstract-aggregate-handler.js";
import { aggregateSnapshotTransformer } from "../aggregate-snapshot-transformer/aggregate-snapshot-transformer.js";

export type AggregateSnapshotCoordinatorOptions<TAggregateRootClass extends EventSourcedAggregateRoot> =
    AbstractAggregateHandlerOptions<TAggregateRootClass> & {
        snapshotRepository?: ISnapshotRepository;
    };

/**
 * Coordinates the creation of snapshots for aggregates.
 */
export abstract class AbstractAggregateSnapshotCoordinator<
    TAggregateRootClass extends EventSourcedAggregateRoot
> extends AbstractAggregateHandler<TAggregateRootClass> {
    protected readonly snapshotRepository?: ISnapshotRepository;

    constructor(options: AggregateSnapshotCoordinatorOptions<TAggregateRootClass>) {
        super(options);
        this.snapshotRepository = options.snapshotRepository;
    }

    /**
     * Creates a snapshot for the aggregate if necessary based on the snapshotting configuration and the aggregate's current state.
     * @param aggregate The aggregate instance.
     * @returns A promise that resolves when the snapshot has been created.
     */
    protected async snapshotIfNecessary(aggregate: InstanceType<TAggregateRootClass>): Promise<void> {
        if (!this.snapshotRepository || !this.isSnapshotable) {
            return;
        }

        const aggregateId = aggregate.getId();

        const logContext = this.getLogContext(aggregateId);

        if (!(await this.shouldCreateSnapshot(aggregate))) {
            return;
        }

        const currentSequenceNumber = aggregate.getCurrentDomainEventSequenceNumber();

        this.logger.verbose(
            logContext,
            `Creating snapshot for ${this.aggregateType} aggregate ${aggregateId} at sequence number ${currentSequenceNumber}`
        );

        const snapshotTestResult = aggregateSnapshotTransformer.canBeRestoredFromSnapshot(
            this.aggregateClass,
            aggregate
        );

        if (!snapshotTestResult.isEqual) {
            this.logger.warn(
                logContext,
                `Snapshotting of aggregate ${this.aggregateClass.name} was skipped because it cannot be fully restored from snapshot. Make sure the aggregate is properly decorated for snapshotting.`
            );

            // NOTE: This is logged directly to the console to make the differences, including class types, more visible.
            console.log("============================================================");
            console.log("Compare the original aggregate and the restored aggregate below to identify the differences:");
            console.log("Before taking snapshot:");
            console.dir(aggregate, { depth: null });
            console.log("After restoring from snapshot:");
            console.dir(snapshotTestResult.restored, { depth: null });
            console.log("============================================================");

            return;
        }

        const snapshot = aggregateSnapshotTransformer.takeSnapshot(
            this.aggregateOrigin,
            this.aggregateType,
            aggregate,
            this.tenantId
        );

        await this.snapshotRepository.saveSnapshot(this.getTransactionContext(), snapshot);

        this.logger.verbose(
            logContext,
            `Snapshot for ${this.aggregateType} aggregate ${aggregateId} created at sequence number ${currentSequenceNumber}`
        );
    }

    private async shouldCreateSnapshot(aggregate: InstanceType<TAggregateRootClass>): Promise<boolean> {
        const currentSequenceNumber = aggregate.getCurrentDomainEventSequenceNumber();

        if (!this.snapshotRepository || currentSequenceNumber === 0) {
            return false;
        }

        const latestSnapshot = await this.snapshotRepository.getLatestSnapshot(
            this.getTransactionContext(),
            this.aggregateOrigin,
            this.aggregateType,
            aggregate.getId(),
            this.tenantId
        );

        const lastSnapshotSequenceNumber = latestSnapshot?.domainEventSequenceNumber ?? 0;

        if (lastSnapshotSequenceNumber >= currentSequenceNumber) {
            return false;
        }

        return currentSequenceNumber - lastSnapshotSequenceNumber >= this.snapshotInterval;
    }
}
