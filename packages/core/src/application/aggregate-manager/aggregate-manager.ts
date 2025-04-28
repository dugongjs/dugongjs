import type { AbstractAggregateRoot } from "../../domain/abstract-aggregate-root/abstract-aggregate-root.js";
import { aggregateDomainEventApplier } from "../../domain/aggregate-domain-event-applier/aggregate-domain-event-applier.js";
import type { IMessageProducer } from "../../ports/outbound/message-broker/i-message-producer.js";
import type { IDomainEventRepository } from "../../ports/outbound/repository/i-domain-event-repository.js";
import type { ISnapshotRepository } from "../../ports/outbound/repository/i-snapshot-repository.js";
import type { TransactionContext } from "../../ports/outbound/transaction-manager/i-transaction-manager.js";
import type { RemoveAbstract } from "../../types/remove-abstract.type.js";
import type { SerializableObject } from "../../types/serializable-object.type.js";
import {
    AbstractAggregateHandler,
    type AbstractAggregateHandlerOptions
} from "../abstract-aggregate-handler/abstract-aggregate-handler.js";
import { aggregateSnapshotTransformer } from "../aggregate-snapshot-transformer/aggregate-snapshot-transformer.js";

export type AggregateManagerOptions<TAggregateRootClass extends RemoveAbstract<typeof AbstractAggregateRoot>> =
    AbstractAggregateHandlerOptions<TAggregateRootClass> & {
        transactionContext: TransactionContext | null;
        domainEventRepository: IDomainEventRepository;
        snapshotRepository: ISnapshotRepository;
        messageProducer?: IMessageProducer;
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
    private readonly transactionContext: TransactionContext | null;
    private readonly domainEventRepository: IDomainEventRepository;
    private readonly snapshotRepository: ISnapshotRepository;
    private readonly messageProducer?: IMessageProducer;

    constructor(options: AggregateManagerOptions<TAggregateRootClass>) {
        super(options);
        this.transactionContext = options.transactionContext;
        this.domainEventRepository = options.domainEventRepository;
        this.snapshotRepository = options.snapshotRepository;
        this.messageProducer = options.messageProducer;
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
            this.logger.verbose(logContext, "No staged domain events to commit");
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

        const serializedEvents = stagedDomainEvents.map((domainEvent) => domainEvent.serialize());

        this.logger.verbose(logContext, `Committing ${serializedEvents.length} staged domain events to event log`);

        await this.domainEventRepository.saveDomainEvents(this.transactionContext, serializedEvents);

        this.logger.verbose(logContext, `Staged domain events committed to event log`);

        if (this.messageProducer) {
            const channelId = this.messageProducer.generateMessageChannelIdForAggregate(
                this.aggregateOrigin,
                this.aggregateType
            );

            this.logger.verbose(
                logContext,
                `Publishing ${serializedEvents.length} staged domain events to message broker on channel ${channelId}`
            );

            await this.messageProducer.publishDomainEventsAsMessages(
                this.transactionContext,
                serializedEvents,
                channelId
            );

            this.logger.verbose(logContext, `Staged domain events published to message broker`);
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
            `Creating snapshot for aggregate ${aggregateId} at sequence number ${currentDomainEventSequenceNumber}`
        );

        const snapshot = aggregateSnapshotTransformer.takeSnapshot(this.aggregateOrigin, this.aggregateType, aggregate);

        await this.snapshotRepository.saveSnapshot(this.transactionContext, snapshot);

        this.logger.verbose(
            logContext,
            `Snapshot for aggregate ${aggregateId} created at sequence number ${currentDomainEventSequenceNumber}`
        );
    }
}
