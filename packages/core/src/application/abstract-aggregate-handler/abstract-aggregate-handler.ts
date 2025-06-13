import type { EventSourcedAggregateRoot } from "../../domain/abstract-event-sourced-aggregate-root/event-sourced-aggregate-root.js";
import { aggregateMetadataRegistry } from "../../domain/aggregate-metadata-registry/aggregate-metadata-registry.js";
import type { ITransactionManager } from "../../ports/index.js";
import { AbstractTransactionCoordinator } from "../abstract-transaction-coordinator/abstract-transaction-coordinator.js";
import { AggregateMetadataNotFoundError } from "../aggregate-factory/errors/aggregate-metadata-not-found.error.js";
import type { ILogger } from "../logger/i-logger.js";
import { VoidLogger } from "../logger/void-logger.js";

export type AbstractAggregateHandlerOptions<TAggregateRootClass extends EventSourcedAggregateRoot> = {
    aggregateClass: TAggregateRootClass;
    transactionManager: ITransactionManager;
    currentOrigin: string;
    tenantId?: string | null;
    logger?: ILogger;
};

/**
 * Abstract class for interacting with aggregates in the application layer.
 * Provides common functionality for aggregate handlers, such as logging and transaction management.
 */
export abstract class AbstractAggregateHandler<
    TAggregateRootClass extends EventSourcedAggregateRoot
> extends AbstractTransactionCoordinator {
    protected readonly aggregateClass: TAggregateRootClass;
    protected readonly logger: ILogger;
    protected readonly logContext: any;
    protected readonly currentOrigin: string;
    protected readonly tenantId?: string | null;
    protected readonly isInternalAggregate: boolean;
    protected readonly aggregateOrigin: string;
    protected readonly aggregateType: string;
    protected readonly isSnapshotable: boolean;
    protected readonly snapshotInterval: number;

    constructor(options: AbstractAggregateHandlerOptions<TAggregateRootClass>) {
        super(options.transactionManager);

        this.aggregateClass = options.aggregateClass;

        const aggregateMetadata = aggregateMetadataRegistry.getAggregateMetadata(this.aggregateClass);

        if (!aggregateMetadata) {
            throw new AggregateMetadataNotFoundError(this.aggregateClass.name);
        }

        this.currentOrigin = options.currentOrigin;
        this.tenantId = options.tenantId;
        const isInternalAggregate = aggregateMetadata.isInternal;
        this.isInternalAggregate = isInternalAggregate;
        this.aggregateOrigin = isInternalAggregate ? options.currentOrigin : aggregateMetadata.origin;
        this.aggregateType = aggregateMetadata.type;

        const snapshotMetadata = aggregateMetadataRegistry.getAggregateSnapshotMetadata(this.aggregateClass);
        this.isSnapshotable = !!snapshotMetadata;
        this.snapshotInterval = snapshotMetadata?.snapshotInterval ?? 10;

        this.logger = options.logger ?? new VoidLogger();

        this.logContext = {
            origin: this.aggregateOrigin,
            aggregateType: this.aggregateType
        };
    }

    protected getLogContext(aggregateId: string): any {
        return {
            ...this.logContext,
            aggregateId
        };
    }
}
