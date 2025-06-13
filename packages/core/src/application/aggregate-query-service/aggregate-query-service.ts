import { aggregateMetadataRegistry, type SerializedDomainEvent } from "../../domain/index.js";
import type { IAggregateQueryService } from "../../ports/common/ipc/i-aggregate-query-service.js";
import type { IDomainEventRepository } from "../../ports/index.js";
import { AggregateFactory } from "../aggregate-factory/aggregate-factory.js";
import { aggregateSnapshotTransformer } from "../aggregate-snapshot-transformer/aggregate-snapshot-transformer.js";
import type { ILogger } from "../logger/i-logger.js";

export type AggregateQueryServiceOptions = {
    currentOrigin: string;
    domainEventRepository: IDomainEventRepository;
    logger?: ILogger;
};

export class AggregateQueryService implements IAggregateQueryService {
    private readonly currentOrigin: string;
    private readonly domainEventRepository: IDomainEventRepository;
    private readonly logger?: ILogger;

    constructor(options: AggregateQueryServiceOptions) {
        this.currentOrigin = options.currentOrigin;
        this.domainEventRepository = options.domainEventRepository;
        this.logger = options.logger;
    }

    public async getAggregateTypes(): Promise<string[]> {
        return aggregateMetadataRegistry.getAggregateTypes();
    }

    public async getAggregateIds(
        origin: string | null,
        aggregateType: string,
        tenantId?: string | null
    ): Promise<string[]> {
        return this.domainEventRepository.getAggregateIds(null, origin ?? this.currentOrigin, aggregateType, tenantId);
    }

    public async getAggregate(
        origin: string | null,
        aggregateType: string,
        aggregateId: string,
        tenantId?: string | null,
        toSequenceNumber?: number
    ): Promise<object | null> {
        const aggregateClass = aggregateMetadataRegistry.getAggregateClass(aggregateType, origin ?? undefined);

        if (!aggregateClass) {
            return null;
        }

        const factory = new AggregateFactory({
            aggregateClass,
            transactionManager: { transaction: (fn) => fn({}) },
            domainEventRepository: this.domainEventRepository,
            currentOrigin: this.currentOrigin,
            tenantId,
            logger: this.logger
        });

        const aggregate = await factory.buildFromEventLog(aggregateId, { toSequenceNumber });

        if (!aggregate) {
            return null;
        }

        const snapshotMetadata = aggregateMetadataRegistry.getAggregateSnapshotMetadata(aggregateClass);

        if (snapshotMetadata) {
            const snapshot = await aggregateSnapshotTransformer.takeSnapshot(
                origin ?? this.currentOrigin,
                aggregateType,
                aggregate,
                tenantId
            );

            return snapshot.snapshotData;
        }

        return aggregate;
    }

    public async getDomainEventsForAggregate(
        origin: string | null,
        aggregateType: string,
        aggregateId: string,
        tenantId?: string | null
    ): Promise<SerializedDomainEvent[]> {
        return this.domainEventRepository.getAggregateDomainEvents(
            null,
            origin ?? this.currentOrigin,
            aggregateType,
            aggregateId,
            tenantId
        );
    }
}
