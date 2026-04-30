import type { IDomainEventRepository, SerializedDomainEvent } from "@dugongjs/core";
import { MoreThanOrEqual, type EntityManager, type FindOptionsWhere, type Repository } from "typeorm";
import { DomainEventEntity } from "../../../infrastructure/db/entities/domain-event.entity.js";
import { denormalizeTenantId, normalizeTenantId } from "../../../infrastructure/db/no-tenant-id.js";

export class DomainEventRepositoryTypeOrm implements IDomainEventRepository {
    constructor(private readonly domainEventRepository: Repository<DomainEventEntity>) {}

    public async getAggregateDomainEvents(
        transactionContext: EntityManager | null,
        origin: string,
        aggregateType: string,
        aggregateId: string,
        tenantId?: string,
        fromSequenceNumber?: number
    ): Promise<SerializedDomainEvent[]> {
        const domainEventRepository =
            transactionContext?.getRepository(DomainEventEntity) ?? this.domainEventRepository;

        const where: FindOptionsWhere<DomainEventEntity> = {
            origin,
            aggregateType,
            aggregateId,
            sequenceNumber: fromSequenceNumber ? MoreThanOrEqual(fromSequenceNumber) : undefined
        };

        if (tenantId !== undefined) {
            where.tenantId = normalizeTenantId(tenantId);
        }

        const serializedDomainEvents = await domainEventRepository.find({
            where,
            order: {
                sequenceNumber: "ASC"
            }
        });

        return serializedDomainEvents.map((domainEvent) => ({
            ...domainEvent,
            tenantId: denormalizeTenantId(domainEvent.tenantId)
        }));
    }

    public async getAggregateIds(
        transactionContext: EntityManager | null,
        origin: string,
        aggregateType: string,
        tenantId?: string | null
    ): Promise<string[]> {
        const domainEventRepository =
            transactionContext?.getRepository(DomainEventEntity) ?? this.domainEventRepository;

        const aggregateIds = await domainEventRepository
            .createQueryBuilder("domainEvent")
            .select("DISTINCT domainEvent.aggregateId", "aggregateId")
            .where("domainEvent.origin = :origin", { origin })
            .andWhere("domainEvent.aggregateType = :aggregateType", { aggregateType })
            .orderBy("domainEvent.aggregateId", "ASC")
            .andWhere(tenantId !== undefined ? "domainEvent.tenantId = :tenantId" : "TRUE", {
                tenantId: normalizeTenantId(tenantId)
            })
            .getRawMany();

        return aggregateIds.map((row) => row.aggregateId);
    }

    public async saveDomainEvents(
        transactionContext: EntityManager | null,
        events: SerializedDomainEvent[]
    ): Promise<void> {
        const domainEventRepository =
            transactionContext?.getRepository(DomainEventEntity) ?? this.domainEventRepository;

        if (events.length === 0) {
            return;
        }

        const domainEventEntities = domainEventRepository.create(
            events.map((event) => ({
                ...event,
                tenantId: normalizeTenantId(event.tenantId)
            }))
        );

        await domainEventRepository.insert(domainEventEntities);
    }
}
