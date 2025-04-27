import type { ISerializedDomainEvent } from "../../domain/abstract-domain-event/i-serialized-domain-event.js";
import type { AbstractEventSourcedAggregateRoot } from "../../domain/abstract-event-sourced-aggregate-root/abstract-event-sourced-aggregate-root.js";
import { aggregateDomainEventApplier } from "../../domain/aggregate-domain-event-applier/aggregate-domain-event-applier.js";
import { domainEventDeserializer } from "../../domain/domain-event-deserializer/domain-event-deserializer.js";
import type { IDomainEventRepository } from "../../ports/outbound/repository/i-domain-event-repository.js";
import type { ISnapshotRepository } from "../../ports/outbound/repository/i-snapshot-repository.js";
import type { TransactionContext } from "../../ports/outbound/transaction-manager/i-transaction-manager.js";
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
    transactionContext: TransactionContext | null;
    domainEventRepository: IDomainEventRepository;
    snapshotRepository: ISnapshotRepository;
};

export type BuildOptions = {
    returnDeleted?: boolean;
    skipSnapshot?: boolean;
};

export class AggregateFactory<
    TAggregateRootClass extends RemoveAbstract<typeof AbstractEventSourcedAggregateRoot>
> extends AbstractAggregateHandler<TAggregateRootClass> {
    private readonly transactionContext: TransactionContext | null;
    private readonly domainEventRepository: IDomainEventRepository;
    private readonly snapshotRepository: ISnapshotRepository;

    constructor(options: AggregateFactoryOptions<TAggregateRootClass>) {
        super(options);
        this.transactionContext = options.transactionContext;
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

        if (this.isSnapshotable && !options.skipSnapshot) {
            this.logger.verbose(logContext, "Aggregate is snapshotable, attempting to build from snapshot");
            aggregate = await this.buildFromLatestSnapshot(aggregateId);
        }

        if (!aggregate) {
            this.logger.verbose(logContext, "Could not build from snapshot, attempting to build from event log");
            aggregate = await this.buildFromEventLog(aggregateId);
        }

        if (!aggregate) {
            this.logger.verbose(logContext, "Aggregate not found");
            return null;
        }

        if (aggregate.isDeleted()) {
            this.logger.verbose(logContext, "Aggregate is deleted");

            if (options.returnDeleted) {
                return aggregate;
            }

            return null;
        }

        return aggregate;
    }

    public async buildFromEventLog(aggregateId: string): Promise<InstanceType<TAggregateRootClass> | null> {
        this.validateAggregateId(aggregateId);

        const logContext = this.getLogContext(aggregateId);

        this.logger.verbose(logContext, "Building aggregate from event log");

        this.logger.verbose(logContext, "Fetching domain events from event log");
        const serializedDomainEvents = await this.domainEventRepository.getAggregateDomainEvents(
            this.transactionContext,
            this.aggregateOrigin,
            this.aggregateType,
            aggregateId
        );

        if (serializedDomainEvents.length === 0) {
            this.logger.verbose(logContext, "No domain events found in event log");

            if (this.isInternalAggregate) {
                return null;
            }

            // TODO: try fetch from remote using outbound port
            return null;
        }

        this.logger.verbose(logContext, `Found ${serializedDomainEvents.length} domain events in event log`);

        const aggregate = new this.aggregateClass().setId(aggregateId) as InstanceType<TAggregateRootClass>;

        return this.deserializeAndApplyDomainEventsToAggregate(aggregate, serializedDomainEvents);
    }

    public async buildFromLatestSnapshot(aggregateId: string): Promise<InstanceType<TAggregateRootClass> | null> {
        this.validateAggregateId(aggregateId);

        const logContext = this.getLogContext(aggregateId);

        this.logger.verbose(logContext, "Building aggregate from latest snapshot");

        this.logger.verbose(logContext, "Fetching latest snapshot");

        const latestSnapshot = await this.snapshotRepository.getLatestSnapshot(
            this.transactionContext,
            this.aggregateOrigin,
            this.aggregateType,
            aggregateId
        );

        if (!latestSnapshot) {
            this.logger.verbose(logContext, "No snapshot found");
            return null;
        }

        this.logger.verbose(
            logContext,
            `Snapshot found, sequence number is ${latestSnapshot.domainEventSequenceNumber}`
        );

        const aggregate = aggregateSnapshotTransformer.restoreFromSnapshot(this.aggregateClass, latestSnapshot);

        const fromSequenceNumber = latestSnapshot.domainEventSequenceNumber + 1;

        this.logger.verbose(
            logContext,
            `Fetching domain events from event log from sequence number ${fromSequenceNumber}`
        );

        const serializedDomainEvents = await this.domainEventRepository.getAggregateDomainEvents(
            this.transactionContext,
            this.aggregateOrigin,
            this.aggregateType,
            aggregateId,
            fromSequenceNumber
        );

        return this.deserializeAndApplyDomainEventsToAggregate(aggregate, serializedDomainEvents);
    }

    private deserializeAndApplyDomainEventsToAggregate(
        aggregate: InstanceType<TAggregateRootClass>,
        serializedDomainEvents: ISerializedDomainEvent[]
    ): InstanceType<TAggregateRootClass> {
        const logContext = this.getLogContext(aggregate.getId());

        const domainEvents = domainEventDeserializer.deserializeDomainEvents(...serializedDomainEvents);

        if (serializedDomainEvents.length !== domainEvents.length) {
            this.logger.warn(
                logContext,
                `Failed to deserialize all domain events, found ${serializedDomainEvents.length} but only ${domainEvents.length} were found`
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
