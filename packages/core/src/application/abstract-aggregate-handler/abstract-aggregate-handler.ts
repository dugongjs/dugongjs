import type { AbstractEventSourcedAggregateRoot } from "../../domain/abstract-event-sourced-aggregate-root/abstract-event-sourced-aggregate-root.js";
import { aggregateMetadataRegistry } from "../../domain/aggregate-metadata-registry/aggregate-metadata-registry.js";
import type { RemoveAbstract } from "../../types/remove-abstract.type.js";
import { AggregateMetadataNotFoundError } from "../aggregate-factory/errors/aggregate-metadata-not-found.error.js";
import type { ILogger } from "../logger/i-logger.js";
import { VoidLogger } from "../logger/void-logger.js";

export type AbstractAggregateHandlerOptions<
    TAggregateRootClass extends RemoveAbstract<typeof AbstractEventSourcedAggregateRoot>
> = {
    aggregateClass: TAggregateRootClass;
    currentOrigin: string;
    logger?: ILogger;
};

export abstract class AbstractAggregateHandler<
    TAggregateRootClass extends RemoveAbstract<typeof AbstractEventSourcedAggregateRoot>
> {
    protected readonly aggregateClass: TAggregateRootClass;
    protected readonly logger: ILogger;
    protected readonly logContext: any;
    protected readonly currentOrigin: string;
    protected readonly isInternalAggregate: boolean;
    protected readonly aggregateOrigin: string;
    protected readonly aggregateType: string;
    protected readonly isSnapshotable: boolean;
    protected readonly snapshotInterval: number;

    constructor(options: AbstractAggregateHandlerOptions<TAggregateRootClass>) {
        this.aggregateClass = options.aggregateClass;
        this.logger = options.logger ?? new VoidLogger();

        const aggregateMetadata = aggregateMetadataRegistry.getAggregateMetadata(this.aggregateClass);

        if (!aggregateMetadata) {
            throw new AggregateMetadataNotFoundError(this.aggregateClass.name);
        }

        this.currentOrigin = options.currentOrigin;
        const isInternalAggregate = aggregateMetadata.isInternal;
        this.isInternalAggregate = isInternalAggregate;
        this.aggregateOrigin = isInternalAggregate ? options.currentOrigin : aggregateMetadata.origin;
        this.aggregateType = aggregateMetadata.type;

        const snapshotMetadata = aggregateMetadataRegistry.getAggregateSnapshotMetadata(this.aggregateClass);
        this.isSnapshotable = !!snapshotMetadata;
        this.snapshotInterval = snapshotMetadata?.snapshotInterval ?? 10;

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
