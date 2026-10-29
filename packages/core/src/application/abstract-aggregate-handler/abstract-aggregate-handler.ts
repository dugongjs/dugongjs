import type { EventSourcedAggregateRoot } from "../../domain/abstract-event-sourced-aggregate-root/event-sourced-aggregate-root.js";
import {
    aggregateMetadataRegistry,
    type AggregateTenancyMode
} from "../../domain/aggregate-metadata-registry/aggregate-metadata-registry.js";
import type { ITransactionManager } from "../../ports/index.js";
import { AbstractTransactionCoordinator } from "../abstract-transaction-coordinator/abstract-transaction-coordinator.js";
import { AggregateMetadataNotFoundError } from "../aggregate-factory/errors/aggregate-metadata-not-found.error.js";
import type { ILogger } from "../logger/i-logger.js";
import { VoidLogger } from "../logger/void-logger.js";
import { tenantScopeResolver } from "../tenant-scope/tenant-scope-resolver.js";
import type { TenantScope } from "../../domain/tenant-scope/tenant-scope.type.js";

export type AbstractAggregateHandlerOptions<TAggregateRootClass extends EventSourcedAggregateRoot> = {
    aggregateClass: TAggregateRootClass;
    transactionManager: ITransactionManager;
    currentOrigin: string;
    tenantScope?: TenantScope;
    requireTenantScope?: boolean;
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
    protected readonly tenantScope: TenantScope | undefined;
    protected readonly tenantId: string | undefined;
    protected readonly requireTenantScope: boolean;
    protected readonly tenancyMode: AggregateTenancyMode | undefined;
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
        this.tenancyMode = aggregateMetadataRegistry.getAggregateTenancyMetadata(this.aggregateClass)?.mode;
        this.tenantScope = tenantScopeResolver.resolve(options.tenantScope, this.tenancyMode);
        this.tenantId = this.tenantScope?.type === "tenant" ? this.tenantScope.tenantId : undefined;
        this.requireTenantScope = options.requireTenantScope ?? false;
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

    protected assertTenantScopeIsSet(operation: string): void {
        tenantScopeResolver.assert({
            aggregateType: this.aggregateType,
            operation,
            tenancyMode: this.tenancyMode,
            tenantScope: this.tenantScope,
            requireTenantScope: this.requireTenantScope
        });
    }
}
