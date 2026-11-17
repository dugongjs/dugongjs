import { aggregateMetadataRegistry, type SerializedDomainEvent } from "../../domain/index.js";
import type {
    AggregateQueryOptions,
    GetAggregateOptions,
    IAggregateQueryService
} from "../../ports/common/ipc/i-aggregate-query-service.js";
import type { IDomainEventRepository } from "../../ports/index.js";
import { AggregateFactory } from "../aggregate-factory/aggregate-factory.js";
import { aggregateSnapshotTransformer } from "../aggregate-snapshot-transformer/aggregate-snapshot-transformer.js";
import type { Constructor } from "../../types/constructor.type.js";
import type { ILogger } from "../logger/i-logger.js";
import { tenantScopeResolver } from "../tenant-scope/tenant-scope-resolver.js";
import type { TenantScope } from "../../domain/tenant-scope/tenant-scope.type.js";

export type AggregateQueryServiceOptions = {
    currentOrigin: string;
    domainEventRepository: IDomainEventRepository;
    requireTenantScope?: boolean;
    logger?: ILogger;
};

export class AggregateQueryService implements IAggregateQueryService {
    private readonly currentOrigin: string;
    private readonly domainEventRepository: IDomainEventRepository;
    private readonly requireTenantScope: boolean;
    private readonly logger?: ILogger;

    constructor(options: AggregateQueryServiceOptions) {
        this.currentOrigin = options.currentOrigin;
        this.domainEventRepository = options.domainEventRepository;
        this.requireTenantScope = options.requireTenantScope ?? false;
        this.logger = options.logger;
    }

    public async getAggregateTypes(): Promise<string[]> {
        return aggregateMetadataRegistry.getAggregateTypes();
    }

    public async getAggregateIds(
        origin: string | null,
        aggregateType: string,
        options: AggregateQueryOptions = {}
    ): Promise<string[]> {
        const tenantScope = this.resolveAndAssertTenantScope(
            origin,
            aggregateType,
            options.tenantScope,
            "getAggregateIds"
        );

        return this.domainEventRepository.getAggregateIds(
            null,
            origin ?? this.currentOrigin,
            aggregateType,
            tenantScopeResolver.toTenantId(tenantScope)
        );
    }

    public async getAggregate(
        origin: string | null,
        aggregateType: string,
        aggregateId: string,
        options: GetAggregateOptions = {}
    ): Promise<object | null> {
        const tenantScope = this.resolveAndAssertTenantScope(
            origin,
            aggregateType,
            options.tenantScope,
            "getAggregate"
        );

        const aggregateClass = this.resolveAggregateClass(origin, aggregateType);

        if (!aggregateClass) {
            return null;
        }

        const factory = new AggregateFactory({
            aggregateClass,
            transactionManager: { transaction: (fn) => fn({}) },
            domainEventRepository: this.domainEventRepository,
            currentOrigin: this.currentOrigin,
            tenantScope,
            logger: this.logger
        });

        const aggregate = await factory.buildFromEventLog(aggregateId, {
            toSequenceNumber: options.toSequenceNumber
        });

        if (!aggregate) {
            return null;
        }

        const snapshotMetadata = aggregateMetadataRegistry.getAggregateSnapshotMetadata(aggregateClass);

        if (snapshotMetadata) {
            const snapshot = await aggregateSnapshotTransformer.takeSnapshot(
                origin ?? this.currentOrigin,
                aggregateType,
                aggregate,
                tenantScopeResolver.toTenantId(tenantScope)
            );

            return snapshot.snapshotData;
        }

        return aggregate;
    }

    public async getDomainEventsForAggregate(
        origin: string | null,
        aggregateType: string,
        aggregateId: string,
        options: AggregateQueryOptions = {}
    ): Promise<SerializedDomainEvent[]> {
        const tenantScope = this.resolveAndAssertTenantScope(
            origin,
            aggregateType,
            options.tenantScope,
            "getDomainEventsForAggregate"
        );

        return this.domainEventRepository.getAggregateDomainEvents(
            null,
            origin ?? this.currentOrigin,
            aggregateType,
            aggregateId,
            tenantScopeResolver.toTenantId(tenantScope)
        );
    }

    private resolveAggregateClass(origin: string | null, aggregateType: string): Constructor | null {
        return (
            aggregateMetadataRegistry.getAggregateClass(aggregateType, origin ?? undefined) ??
            aggregateMetadataRegistry.getAggregateClass(aggregateType, undefined)
        );
    }

    private resolveAndAssertTenantScope(
        origin: string | null,
        aggregateType: string,
        requestedTenantScope: TenantScope | undefined,
        operation: string
    ): TenantScope | undefined {
        const aggregateClass = this.resolveAggregateClass(origin, aggregateType);
        const tenancyMode = aggregateClass
            ? aggregateMetadataRegistry.getAggregateTenancyMetadata(aggregateClass)?.mode
            : undefined;

        const tenantScope = tenantScopeResolver.resolve(requestedTenantScope, tenancyMode);

        tenantScopeResolver.assert({
            aggregateType,
            operation,
            tenancyMode,
            tenantScope,
            requireTenantScope: this.requireTenantScope
        });

        return tenantScope;
    }
}
