import type { SerializedDomainEvent } from "../../domain/abstract-domain-event/serialized-domain-event.js";
import type { AbstractEventSourcedAggregateRoot } from "../../domain/abstract-event-sourced-aggregate-root/abstract-event-sourced-aggregate-root.js";
import { aggregateDomainEventApplier } from "../../domain/aggregate-domain-event-applier/aggregate-domain-event-applier.js";
import { domainEventDeserializer } from "../../domain/domain-event-deserializer/domain-event-deserializer.js";
import type { IDomainEventRepository } from "../../ports/outbound/repository/i-domain-event-repository.js";
import type { ISnapshotRepository } from "../../ports/outbound/repository/i-snapshot-repository.js";
import type { RemoveAbstract } from "../../types/remove-abstract.type.js";
import {
    AbstractAggregateHandler,
    type AbstractAggregateHandlerOptions
} from "../abstract-aggregate-handler/abstract-aggregate-handler.js";
import { aggregateSnapshotTransformer } from "../aggregate-snapshot-transformer/aggregate-snapshot-transformer.js";
import { MissingAggregateIdError } from "./errors/missing-aggregate-id.error.js";

export type AggregateFactoryOptions<
    TAggregateRootClass extends RemoveAbstract<typeof AbstractEventSourcedAggregateRoot>
> = AbstractAggregateHandlerOptions<TAggregateRootClass> & {
    domainEventRepository: IDomainEventRepository;
    snapshotRepository?: ISnapshotRepository;
};

export type BuildOptions = {
    returnDeleted?: boolean;
    skipSnapshot?: boolean;
};

export type BuildFromEventLogOptions = {
    toSequenceNumber?: number;
};

export class AggregateFactory<
    TAggregateRootClass extends RemoveAbstract<typeof AbstractEventSourcedAggregateRoot>
> extends AbstractAggregateHandler<TAggregateRootClass> {
    private readonly domainEventRepository: IDomainEventRepository;
    private readonly snapshotRepository?: ISnapshotRepository;

    constructor(options: AggregateFactoryOptions<TAggregateRootClass>) {
        super(options);
        this.domainEventRepository = options.domainEventRepository;
        this.snapshotRepository = options.snapshotRepository;
    }

    public async build(
        aggregateId: string,
        options: BuildOptions = {}
    ): Promise<InstanceType<TAggregateRootClass> | null> {
        this.validateAggregateId(aggregateId);

        const logContext = this.getLogContext(aggregateId);

        let aggregate: InstanceType<TAggregateRootClass> | null = null;

        if (this.snapshotRepository && this.isSnapshotable && !options.skipSnapshot) {
            this.logger.verbose(
                logContext,
                `${this.aggregateType} aggregate is snapshotable, attempting to build from snapshot`
            );
            aggregate = await this.buildFromLatestSnapshot(aggregateId);

            if (!aggregate) {
                this.logger.verbose(
                    logContext,
                    `Failed to build ${this.aggregateType} aggregate ${aggregateId} from snapshot, falling back to event log`
                );
            }
        }

        if (!aggregate) {
            aggregate = await this.buildFromEventLog(aggregateId);
        }

        if (!aggregate) {
            this.logger.verbose(logContext, `${this.aggregateType} aggregate ${aggregateId} not found`);
            return null;
        }

        if (aggregate.isDeleted()) {
            this.logger.verbose(logContext, `${this.aggregateType} aggregate ${aggregateId} is deleted`);

            if (options.returnDeleted) {
                return aggregate;
            }

            return null;
        }

        return aggregate;
    }

    public async buildFromEventLog(
        aggregateId: string,
        options: BuildFromEventLogOptions = {}
    ): Promise<InstanceType<TAggregateRootClass> | null> {
        this.validateAggregateId(aggregateId);

        const logContext = this.getLogContext(aggregateId);

        this.logger.verbose(logContext, `Building ${this.aggregateType} aggregate ${aggregateId} from event log`);

        this.logger.verbose(
            logContext,
            `Fetching domain events from event log for ${this.aggregateType} aggregate ${aggregateId}`
        );
        const serializedDomainEvents = await this.domainEventRepository.getAggregateDomainEvents(
            this.getTransactionContext(),
            this.aggregateOrigin,
            this.aggregateType,
            aggregateId
        );

        if (serializedDomainEvents.length === 0) {
            this.logger.verbose(
                logContext,
                `No domain events found for ${this.aggregateType} aggregate ${aggregateId} in event log`
            );

            if (this.isInternalAggregate) {
                return null;
            }

            // TODO: try fetch from remote using outbound port
            return null;
        }

        this.logger.verbose(
            logContext,
            `Found ${serializedDomainEvents.length} domain events for ${this.aggregateType} aggregate ${aggregateId} in event log`
        );

        const aggregate = new this.aggregateClass().setId(aggregateId) as InstanceType<TAggregateRootClass>;

        let serializedDomainEventsToApply = serializedDomainEvents;

        if (options.toSequenceNumber) {
            const maxSequenceNumber = Math.max(...serializedDomainEvents.map((event) => event.sequenceNumber));

            if (options.toSequenceNumber > maxSequenceNumber) {
                this.logger.error(
                    logContext,
                    `Requested toSequenceNumber ${options.toSequenceNumber} is greater than the maximum sequence number ${maxSequenceNumber} for ${this.aggregateType} aggregate ${aggregateId}`
                );
                return null;
            }

            this.logger.verbose(
                logContext,
                `Building ${this.aggregateType} aggregate ${aggregateId} to sequence number ${options.toSequenceNumber}`
            );

            serializedDomainEventsToApply = serializedDomainEvents.filter(
                (event) => event.sequenceNumber <= options.toSequenceNumber!
            );
        }

        return this.deserializeAndApplyDomainEventsToAggregate(aggregate, serializedDomainEventsToApply);
    }

    public async buildFromLatestSnapshot(aggregateId: string): Promise<InstanceType<TAggregateRootClass> | null> {
        this.validateAggregateId(aggregateId);

        const logContext = this.getLogContext(aggregateId);

        if (!this.snapshotRepository) {
            this.logger.verbose(logContext, `Snapshot repository not available, skipping snapshot build`);
            return null;
        }

        this.logger.verbose(logContext, `Fetching latest snapshot for ${this.aggregateType} aggregate ${aggregateId}`);

        const latestSnapshot = await this.snapshotRepository.getLatestSnapshot(
            this.getTransactionContext(),
            this.aggregateOrigin,
            this.aggregateType,
            aggregateId
        );

        if (!latestSnapshot) {
            this.logger.verbose(logContext, `No snapshot found for ${this.aggregateType} aggregate ${aggregateId}`);
            return null;
        }

        this.logger.verbose(
            logContext,
            `Snapshot found for ${this.aggregateType} aggregate ${aggregateId}, sequence number is ${latestSnapshot.domainEventSequenceNumber}`
        );

        const aggregate = aggregateSnapshotTransformer.restoreFromSnapshot(this.aggregateClass, latestSnapshot);

        const fromSequenceNumber = latestSnapshot.domainEventSequenceNumber + 1;

        this.logger.verbose(
            logContext,
            `Fetching domain events from event log from sequence number ${fromSequenceNumber} for ${this.aggregateType} aggregate ${aggregateId}`
        );

        const serializedDomainEvents = await this.domainEventRepository.getAggregateDomainEvents(
            this.getTransactionContext(),
            this.aggregateOrigin,
            this.aggregateType,
            aggregateId,
            fromSequenceNumber
        );

        return this.deserializeAndApplyDomainEventsToAggregate(aggregate, serializedDomainEvents);
    }

    private deserializeAndApplyDomainEventsToAggregate(
        aggregate: InstanceType<TAggregateRootClass>,
        serializedDomainEvents: SerializedDomainEvent[]
    ): InstanceType<TAggregateRootClass> {
        const logContext = this.getLogContext(aggregate.getId());

        const domainEvents = domainEventDeserializer.deserializeDomainEvents(...serializedDomainEvents);

        if (serializedDomainEvents.length !== domainEvents.length) {
            this.logger.warn(
                logContext,
                `Failed to deserialize all domain events, ${serializedDomainEvents.length} were found for the aggregate but ${domainEvents.length} were deserialized - this may be caused by a stale domain event collection or a missing '@DomainEvent()' decorator on the domain event class`
            );
        }

        for (const domainEvent of domainEvents) {
            aggregateDomainEventApplier.applyDomainEventToAggregate(aggregate, domainEvent);
        }

        return aggregate;
    }

    private validateAggregateId(aggregateId: string | undefined): void {
        // Should normally not happen, but can lead to serious issues if it does
        if (!aggregateId) {
            throw new MissingAggregateIdError();
        }
    }
}
