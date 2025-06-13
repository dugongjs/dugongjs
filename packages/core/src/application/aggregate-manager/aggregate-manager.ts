import type { AggregateRoot } from "../../domain/abstract-aggregate-root/aggregate-root.js";
import type { AbstractDomainEvent } from "../../domain/abstract-domain-event/abstract-domain-event.js";
import type { SerializedDomainEvent } from "../../domain/abstract-domain-event/serialized-domain-event.js";
import { aggregateDomainEventApplier } from "../../domain/aggregate-domain-event-applier/aggregate-domain-event-applier.js";
import type { IMessageProducer } from "../../ports/outbound/message-broker/i-message-producer.js";
import type { IOutboundMessageMapper } from "../../ports/outbound/message-broker/i-outbound-message-mapper.js";
import type { IDomainEventRepository } from "../../ports/outbound/repository/i-domain-event-repository.js";
import type { ISnapshotRepository } from "../../ports/outbound/repository/i-snapshot-repository.js";
import type { SerializableObject } from "../../types/serializable-object.type.js";
import {
    AbstractAggregateHandler,
    type AbstractAggregateHandlerOptions
} from "../abstract-aggregate-handler/abstract-aggregate-handler.js";
import { aggregateSnapshotTransformer } from "../aggregate-snapshot-transformer/aggregate-snapshot-transformer.js";
import { MissingProducerOrMapperError } from "./errors/missing-producer-or-mapper.error.js";

export type AggregateManagerOptions<TAggregateRootClass extends AggregateRoot> =
    AbstractAggregateHandlerOptions<TAggregateRootClass> & {
        domainEventRepository: IDomainEventRepository;
        snapshotRepository: ISnapshotRepository;
        messageProducer?: IMessageProducer<any>;
        outboundMessageMapper?: IOutboundMessageMapper<any>;
    };

export type CommitOptions = {
    correlationId?: string;
    triggeredByUserId?: string;
    triggeredByEventId?: string;
    metadata?: SerializableObject;
};

/**
 * Manager for handling aggregates in the application layer.
 * Provides methods for applying and committing domain events, creating snapshots, and publishing domain events as messages.
 */
export class AggregateManager<
    TAggregateRootClass extends AggregateRoot
> extends AbstractAggregateHandler<TAggregateRootClass> {
    private readonly domainEventRepository: IDomainEventRepository;
    private readonly snapshotRepository: ISnapshotRepository;
    private readonly messageProducer?: IMessageProducer<any>;
    private readonly outboundMessageMapper?: IOutboundMessageMapper<any>;

    constructor(options: AggregateManagerOptions<TAggregateRootClass>) {
        super(options);
        this.domainEventRepository = options.domainEventRepository;
        this.snapshotRepository = options.snapshotRepository;
        this.messageProducer = options.messageProducer;
        this.outboundMessageMapper = options.outboundMessageMapper;

        if (
            (this.messageProducer && !this.outboundMessageMapper) ||
            (!this.messageProducer && this.outboundMessageMapper)
        ) {
            throw new MissingProducerOrMapperError();
        }
    }

    /**
     * Applies staged domain events to the aggregate.
     * @param aggregate The aggregate instance to which the domain events will be applied.
     */
    public applyStagedDomainEvents(aggregate: InstanceType<TAggregateRootClass>): void {
        aggregateDomainEventApplier.applyStagedDomainEventsToAggregate(aggregate);
    }

    /**
     * Commits staged domain events to the event log and publishes them as messages if necessary.
     * @param aggregate The aggregate instance whose staged domain events will be committed.
     * @param options Options for committing domain events, such as correlation ID, triggered by user ID, and metadata.
     */
    public async commitStagedDomainEvents(
        aggregate: InstanceType<TAggregateRootClass>,
        options: CommitOptions = {}
    ): Promise<void> {
        const aggregateId = aggregate.getId();

        const logCtx = this.getLogContext(aggregateId);

        const stagedDomainEvents = aggregate.getStagedDomainEvents();

        if (stagedDomainEvents.length === 0) {
            this.logger.verbose(logCtx, "No staged domain events to commit");
            return;
        }

        for (const domainEvent of stagedDomainEvents) {
            this.injectDomainEventMetadata(domainEvent, options);
        }

        const domainEvents = stagedDomainEvents.map((domainEvent) => domainEvent.serialize());

        this.logger.verbose(logCtx, `Committing ${domainEvents.length} staged domain events to event log`);

        await this.domainEventRepository.saveDomainEvents(this.getTransactionContext(), domainEvents);

        await this.publishDomainEventsAsMessagesIfNecessary(aggregateId, domainEvents);

        aggregate.clearStagedDomainEvents();

        await this.createSnapshotIfNecessary(aggregate);
    }

    /**
     * Applies and commits staged domain events for the given aggregate instance.
     * This method combines the application and committing of staged domain events into a single operation.
     * @param aggregate The aggregate instance for which the staged domain events will be applied and committed.
     * @param options The options for committing the domain events, such as correlation ID, triggered by user ID, and metadata.
     */
    public async applyAndCommitStagedDomainEvents(
        aggregate: InstanceType<TAggregateRootClass>,
        options: CommitOptions = {}
    ): Promise<void> {
        this.applyStagedDomainEvents(aggregate);
        await this.commitStagedDomainEvents(aggregate, options);
    }

    private injectDomainEventMetadata(domainEvent: AbstractDomainEvent, options: CommitOptions): void {
        if (this.tenantId) {
            domainEvent.setTenantId(this.tenantId);
        }
        if (options.correlationId) {
            domainEvent.setCorrelationId(options.correlationId);
        }
        if (options.triggeredByUserId) {
            domainEvent.setTriggeredByUserId(options.triggeredByUserId);
        }
        if (options.triggeredByEventId) {
            domainEvent.setTriggeredByEventId(options.triggeredByEventId);
        }
        if (options.metadata) {
            domainEvent.setMetadata(options.metadata);
        }
    }

    private async publishDomainEventsAsMessagesIfNecessary(
        aggregateId: string,
        domainEvents: SerializedDomainEvent[]
    ): Promise<void> {
        const logCtx = this.getLogContext(aggregateId);

        if (this.messageProducer && this.outboundMessageMapper) {
            const channelId = this.messageProducer.generateMessageChannelIdForAggregate(
                this.aggregateOrigin,
                this.aggregateType
            );

            this.logger.verbose(
                logCtx,
                `Publishing ${domainEvents.length} staged domain events to message broker on channel ${channelId}`
            );

            const messages = domainEvents.map((domainEvent) => this.outboundMessageMapper!.map(domainEvent));

            await this.messageProducer.publishMessages(this.getTransactionContext(), channelId, messages);

            this.logger.verbose(
                logCtx,
                `${domainEvents.length} staged domain events published to message broker on channel ${channelId}`
            );
        }
    }

    private async createSnapshotIfNecessary(aggregate: InstanceType<TAggregateRootClass>): Promise<void> {
        const aggregateId = aggregate.getId();

        const logContext = this.getLogContext(aggregateId);

        if (!this.isSnapshotable) {
            return;
        }

        const currentDomainEventSequenceNumber = aggregate.getCurrentDomainEventSequenceNumber();

        const shouldCreateSnapshot =
            currentDomainEventSequenceNumber > 0 && currentDomainEventSequenceNumber % this.snapshotInterval === 0;

        if (!shouldCreateSnapshot) {
            return;
        }

        this.logger.verbose(
            logContext,
            `Creating snapshot for ${this.aggregateType} aggregate ${aggregateId} at sequence number ${currentDomainEventSequenceNumber}`
        );

        const snapshot = aggregateSnapshotTransformer.takeSnapshot(
            this.aggregateOrigin,
            this.aggregateType,
            aggregate,
            this.tenantId
        );

        await this.snapshotRepository.saveSnapshot(this.getTransactionContext(), snapshot);

        this.logger.verbose(
            logContext,
            `Snapshot for ${this.aggregateType} aggregate ${aggregateId} created at sequence number ${currentDomainEventSequenceNumber}`
        );
    }
}
