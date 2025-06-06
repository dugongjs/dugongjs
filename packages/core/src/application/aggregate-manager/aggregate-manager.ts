import type { AbstractAggregateRoot } from "../../domain/abstract-aggregate-root/abstract-aggregate-root.js";
import { aggregateDomainEventApplier } from "../../domain/aggregate-domain-event-applier/aggregate-domain-event-applier.js";
import type { IOutboundMessageMapper } from "../../ports/index.js";
import type { IMessageProducer } from "../../ports/outbound/message-broker/i-message-producer.js";
import type { IDomainEventRepository } from "../../ports/outbound/repository/i-domain-event-repository.js";
import type { ISnapshotRepository } from "../../ports/outbound/repository/i-snapshot-repository.js";
import type { RemoveAbstract } from "../../types/remove-abstract.type.js";
import type { SerializableObject } from "../../types/serializable-object.type.js";
import {
    AbstractAggregateHandler,
    type AbstractAggregateHandlerOptions
} from "../abstract-aggregate-handler/abstract-aggregate-handler.js";
import { aggregateSnapshotTransformer } from "../aggregate-snapshot-transformer/aggregate-snapshot-transformer.js";
import { MissingProducerOrMapperError } from "./errors/missing-producer-or-mapper.error.js";

export type AggregateManagerOptions<TAggregateRootClass extends RemoveAbstract<typeof AbstractAggregateRoot>> =
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

export class AggregateManager<
    TAggregateRootClass extends RemoveAbstract<typeof AbstractAggregateRoot>
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

    public applyStagedDomainEvents(aggregate: InstanceType<TAggregateRootClass>): void {
        aggregateDomainEventApplier.applyStagedDomainEventsToAggregate(aggregate);
    }

    public async commitStagedDomainEvents(
        aggregate: InstanceType<TAggregateRootClass>,
        options: CommitOptions = {}
    ): Promise<void> {
        const aggregateId = aggregate.getId();

        const logContext = this.getLogContext(aggregateId);

        const stagedDomainEvents = aggregate.getStagedDomainEvents();

        if (stagedDomainEvents.length === 0) {
            this.logger.verbose(logContext, `No staged domain events to commit for aggregate ${aggregateId}`);
            return;
        }

        for (const domainEvent of stagedDomainEvents) {
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

        const serializedDomainEvents = stagedDomainEvents.map((domainEvent) => domainEvent.serialize());

        this.logger.verbose(
            logContext,
            `Committing ${serializedDomainEvents.length} staged domain events to event log for ${this.aggregateType} aggregate ${aggregateId}`
        );

        await this.domainEventRepository.saveDomainEvents(this.getTransactionContext(), serializedDomainEvents);

        this.logger.verbose(
            logContext,
            `${serializedDomainEvents.length} staged domain events committed to event log for ${this.aggregateType} aggregate ${aggregateId}`
        );

        if (this.messageProducer && this.outboundMessageMapper) {
            const channelId = this.messageProducer.generateMessageChannelIdForAggregate(
                this.aggregateOrigin,
                this.aggregateType
            );

            this.logger.verbose(
                logContext,
                `Publishing ${serializedDomainEvents.length} staged domain events to message broker on channel ${channelId}`
            );

            const messages = serializedDomainEvents.map((serializedDomainEvent) =>
                this.outboundMessageMapper!.map(serializedDomainEvent)
            );

            await this.messageProducer.publishMessages(this.getTransactionContext(), channelId, messages);

            this.logger.verbose(
                logContext,
                `${serializedDomainEvents.length} staged domain events published to message broker on channel ${channelId}`
            );
        }

        aggregate.clearStagedDomainEvents();

        await this.createSnapshotIfNecessary(aggregate);
    }

    public async applyAndCommitStagedDomainEvents(
        aggregate: InstanceType<TAggregateRootClass>,
        options: CommitOptions = {}
    ): Promise<void> {
        this.applyStagedDomainEvents(aggregate);
        await this.commitStagedDomainEvents(aggregate, options);
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

        const snapshot = aggregateSnapshotTransformer.takeSnapshot(this.aggregateOrigin, this.aggregateType, aggregate);

        await this.snapshotRepository.saveSnapshot(this.getTransactionContext(), snapshot);

        this.logger.verbose(
            logContext,
            `Snapshot for ${this.aggregateType} aggregate ${aggregateId} created at sequence number ${currentDomainEventSequenceNumber}`
        );
    }
}
