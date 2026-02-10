import type { SerializedDomainEvent } from "../../domain/abstract-domain-event/serialized-domain-event.js";
import type { EventSourcedAggregateRoot } from "../../domain/abstract-event-sourced-aggregate-root/event-sourced-aggregate-root.js";
import { aggregateDomainEventApplier } from "../../domain/aggregate-domain-event-applier/aggregate-domain-event-applier.js";
import { domainEventDeserializer } from "../../domain/domain-event-deserializer/domain-event-deserializer.js";
import type { IExternalOriginMap } from "../../ports/outbound/ipc/i-external-origin-map.js";
import type { IDomainEventRepository } from "../../ports/outbound/repository/i-domain-event-repository.js";
import type { ISnapshotRepository, SerializedSnapshot } from "../../ports/outbound/repository/i-snapshot-repository.js";
import { type AbstractAggregateHandlerOptions } from "../abstract-aggregate-handler/abstract-aggregate-handler.js";
import { AbstractAggregateSnapshotCoordinator } from "../abstract-aggregate-snapshot-coordinator/abstract-aggregate-snapshot-coordinator.js";
import type { AggregateQueryService } from "../aggregate-query-service/aggregate-query-service.js";
import { aggregateSnapshotTransformer } from "../aggregate-snapshot-transformer/aggregate-snapshot-transformer.js";
import { MissingAggregateIdError } from "./errors/missing-aggregate-id.error.js";

export type AggregateFactoryOptions<TAggregateRootClass extends EventSourcedAggregateRoot> =
    AbstractAggregateHandlerOptions<TAggregateRootClass> & {
        domainEventRepository: IDomainEventRepository;
        snapshotRepository?: ISnapshotRepository;
        externalOriginMap?: IExternalOriginMap;
    };

export type BuildOptions = {
    returnDeleted?: boolean;
    skipSnapshot?: boolean;
};

export type BuildFromEventLogOptions = {
    toSequenceNumber?: number;
};

/**
 * Factory class for building aggregates from event logs and snapshots.
 * Can build both internal and external aggregates.
 */
export class AggregateFactory<
    TAggregateRootClass extends EventSourcedAggregateRoot
> extends AbstractAggregateSnapshotCoordinator<TAggregateRootClass> {
    private readonly domainEventRepository: IDomainEventRepository;
    private readonly externalOriginMap: IExternalOriginMap;

    constructor(options: AggregateFactoryOptions<TAggregateRootClass>) {
        super(options);
        this.domainEventRepository = options.domainEventRepository;
        this.externalOriginMap = options.externalOriginMap ?? new Map<string, AggregateQueryService>();
    }

    /**
     * Builds an aggregate from the event log or snapshot.
     * @param aggregateId The ID of the aggregate to build.
     * @param options Options for building the aggregate.
     * @returns The built aggregate or null if not found.
     */
    public async build(
        aggregateId: string,
        options: BuildOptions = {}
    ): Promise<InstanceType<TAggregateRootClass> | null> {
        this.validateAggregateId(aggregateId);

        const logCtx = this.getLogContext(aggregateId);

        let aggregate: InstanceType<TAggregateRootClass> | null = null;

        if (this.snapshotRepository && this.isSnapshotable && !options.skipSnapshot) {
            try {
                aggregate = await this.buildFromLatestSnapshot(aggregateId);
            } catch (error) {
                this.logger.error(error);
            }
        }

        if (!aggregate) {
            aggregate = await this.buildFromEventLog(aggregateId);
        }

        if (!aggregate) {
            this.logger.verbose(logCtx, "Aggregate not found");
            return null;
        }

        if (aggregate.isDeleted() && !options.returnDeleted) {
            this.logger.verbose(logCtx, "Aggregate is deleted");
            return null;
        }

        return aggregate;
    }

    /**
     * Builds an aggregate from the event log.
     * @param aggregateId The ID of the aggregate to build.
     * @param options Options for building the aggregate from the event log.
     * @returns The built aggregate or null if not found.
     */
    public async buildFromEventLog(
        aggregateId: string,
        options: BuildFromEventLogOptions = {}
    ): Promise<InstanceType<TAggregateRootClass> | null> {
        this.validateAggregateId(aggregateId);

        const logCtx = this.getLogContext(aggregateId);

        this.logger.verbose(logCtx, "Building aggregate from event log");

        const domainEvents = await this.loadDomainEventsForAggregate(aggregateId);

        if (domainEvents.length === 0) {
            this.logger.verbose(logCtx, "No domain events found");
            return null;
        }

        this.logger.verbose(logCtx, `Found ${domainEvents.length} domain events in event log`);

        let domainEventsToApply = domainEvents;

        if (options.toSequenceNumber) {
            const maxSequenceNumber = Math.max(...domainEvents.map((event) => event.sequenceNumber));

            if (options.toSequenceNumber > maxSequenceNumber) {
                this.logger.error(
                    logCtx,
                    `Requested toSequenceNumber ${options.toSequenceNumber} exceeds maximum sequence number ${maxSequenceNumber}`
                );
                return null;
            }

            this.logger.verbose(logCtx, `Building aggregate to sequence number ${options.toSequenceNumber}`);

            domainEventsToApply = domainEvents.filter((event) => event.sequenceNumber <= options.toSequenceNumber!);
        }

        const aggregateBase = new this.aggregateClass().setId(aggregateId) as InstanceType<TAggregateRootClass>;

        const aggregate = this.applySerializedDomainEvents(aggregateBase, domainEventsToApply);

        await this.snapshotIfNecessary(aggregate);

        return aggregate;
    }

    /**
     * Builds an aggregate from the latest snapshot if available.
     * @param aggregateId The ID of the aggregate to build from the latest snapshot.
     * @returns The built aggregate or null if no snapshot is available.
     */
    public async buildFromLatestSnapshot(aggregateId: string): Promise<InstanceType<TAggregateRootClass> | null> {
        this.validateAggregateId(aggregateId);

        const logCtx = this.getLogContext(aggregateId);

        if (!this.snapshotRepository) {
            this.logger.verbose(logCtx, `Snapshot repository not available, skipping snapshot build`);
            return null;
        }

        this.logger.verbose(logCtx, "Fetching latest snapshot");

        let latestSnapshot: SerializedSnapshot | null = null;

        try {
            latestSnapshot = await this.snapshotRepository.getLatestSnapshot(
                this.getTransactionContext(),
                this.aggregateOrigin,
                this.aggregateType,
                aggregateId,
                this.tenantId
            );
        } catch (error) {
            this.logger.error(logCtx, "Failed to fetch latest snapshot");
            this.logger.error(error);
            return null;
        }

        if (!latestSnapshot) {
            this.logger.verbose(logCtx, "No snapshot available");
            return null;
        }

        this.logger.verbose(logCtx, `Snapshot found at sequence number ${latestSnapshot.domainEventSequenceNumber}`);

        const aggregate = aggregateSnapshotTransformer.restoreFromSnapshot(this.aggregateClass, latestSnapshot);

        const fromSequenceNumber = latestSnapshot.domainEventSequenceNumber + 1;

        this.logger.verbose(logCtx, `Fetching domain events from event log from sequence number ${fromSequenceNumber}`);

        const domainEvents = await this.domainEventRepository.getAggregateDomainEvents(
            this.getTransactionContext(),
            this.aggregateOrigin,
            this.aggregateType,
            aggregateId,
            this.tenantId,
            fromSequenceNumber
        );

        return this.applySerializedDomainEvents(aggregate, domainEvents);
    }

    private async loadDomainEventsForAggregate(aggregateId: string): Promise<SerializedDomainEvent[]> {
        const domainEvents = await this.domainEventRepository.getAggregateDomainEvents(
            this.getTransactionContext(),
            this.aggregateOrigin,
            this.aggregateType,
            aggregateId,
            this.tenantId
        );

        if (this.isInternalAggregate) {
            return domainEvents;
        }

        const isEventLogEmpty = domainEvents.length === 0;

        if (isEventLogEmpty || this.isEventLogIncomplete(domainEvents)) {
            return this.fetchDomainEventsFromExternalOrigin(aggregateId);
        }

        return domainEvents;
    }

    private async fetchDomainEventsFromExternalOrigin(aggregateId: string): Promise<SerializedDomainEvent[]> {
        const logCtx = this.getLogContext(aggregateId);

        if (!this.externalOriginMap.has(this.aggregateOrigin)) {
            this.logger.warn(logCtx, "No external origin configured in external origin map");
            return Promise.resolve([]);
        }

        const externalAggregateQueryService = this.externalOriginMap.get(this.aggregateOrigin)!;

        try {
            this.logger.verbose(logCtx, `Fetching domain events from external origin ${this.aggregateOrigin}`);
            const domainEvents = await externalAggregateQueryService.getDomainEventsForAggregate(
                this.aggregateOrigin,
                this.aggregateType,
                aggregateId,
                this.tenantId
            );

            this.logger.verbose(
                logCtx,
                `Fetched ${domainEvents.length} domain events from external origin ${this.aggregateOrigin}`
            );

            await this.domainEventRepository.saveDomainEvents(this.getTransactionContext(), domainEvents);

            return domainEvents;
        } catch (error) {
            this.logger.error(logCtx, `Failed to fetch domain events from external origin ${this.aggregateOrigin}`);
            this.logger.error(error);
            return Promise.resolve([]);
        }
    }

    private applySerializedDomainEvents(
        aggregate: InstanceType<TAggregateRootClass>,
        serializedDomainEvents: SerializedDomainEvent[]
    ): InstanceType<TAggregateRootClass> {
        const logCtx = this.getLogContext(aggregate.getId());

        const domainEvents = domainEventDeserializer.deserializeDomainEvents(...serializedDomainEvents);

        if (serializedDomainEvents.length !== domainEvents.length) {
            this.logger.warn(
                logCtx,
                `Failed to deserialize all domain events, ${serializedDomainEvents.length} were found for the aggregate but ${domainEvents.length} were deserialized - this may be caused by a stale domain event collection or a missing '@DomainEvent()' decorator on the domain event class`
            );
        }

        for (const domainEvent of domainEvents) {
            aggregateDomainEventApplier.applyDomainEventToAggregate(aggregate, domainEvent);
        }

        return aggregate;
    }

    private isEventLogIncomplete(domainEvents: SerializedDomainEvent[]): boolean {
        if (domainEvents.length === 0) {
            return false;
        }
        const lastSequenceNumber = domainEvents[domainEvents.length - 1].sequenceNumber;
        return lastSequenceNumber !== domainEvents.length;
    }

    private validateAggregateId(aggregateId: string | undefined): void {
        if (!aggregateId) {
            throw new MissingAggregateIdError();
        }
    }
}
