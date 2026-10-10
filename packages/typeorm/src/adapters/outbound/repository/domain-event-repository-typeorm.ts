import type { IDomainEventRepository, SerializedDomainEvent } from "@dugongjs/core";
import { In, MoreThanOrEqual, type EntityManager, type FindOptionsWhere, type Repository } from "typeorm";
import { denormalizeTenantId, normalizeTenantId } from "../../../infrastructure/db/no-tenant-id.js";

export class DomainEventRepositoryTypeOrm implements IDomainEventRepository {
    constructor(private readonly domainEventRepository: Repository<SerializedDomainEvent>) {}

    public async getAggregateDomainEvents(
        transactionContext: EntityManager | null,
        origin: string,
        aggregateType: string,
        aggregateId: string,
        tenantId?: string | null,
        fromSequenceNumber?: number
    ): Promise<SerializedDomainEvent[]> {
        const domainEventRepository = this.resolveRepository(transactionContext);

        const where: FindOptionsWhere<SerializedDomainEvent> = {
            origin,
            aggregateType,
            aggregateId,
            sequenceNumber: fromSequenceNumber ? MoreThanOrEqual(fromSequenceNumber) : undefined,
            tenantId: normalizeTenantId(tenantId)
        };

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
        const domainEventRepository = this.resolveRepository(transactionContext);

        const aggregateIds = await domainEventRepository
            .createQueryBuilder("domainEvent")
            .select("DISTINCT domainEvent.aggregateId", "aggregateId")
            .where("domainEvent.origin = :origin", { origin })
            .andWhere("domainEvent.aggregateType = :aggregateType", { aggregateType })
            .orderBy("domainEvent.aggregateId", "ASC")
            .andWhere("domainEvent.tenantId = :tenantId", { tenantId: normalizeTenantId(tenantId) })
            .getRawMany();

        return aggregateIds.map((row) => row.aggregateId);
    }

    public async saveDomainEvents(
        transactionContext: EntityManager | null,
        events: SerializedDomainEvent[]
    ): Promise<void> {
        const domainEventRepository = this.resolveRepository(transactionContext);

        if (events.length === 0) {
            return;
        }

        // Check which events already exist by ID
        const eventIds = events.map((event) => event.id);
        const existingEvents = await domainEventRepository.find({
            where: {
                id: In(eventIds)
            },
            select: ["id"]
        });

        const existingIds = new Set(existingEvents.map((event) => event.id));

        // Only insert events that don't already exist by ID
        const newEvents = events.filter((event) => !existingIds.has(event.id));

        if (newEvents.length === 0) {
            return;
        }

        const domainEventEntities = domainEventRepository.create(
            newEvents.map((event) => ({
                ...event,
                tenantId: normalizeTenantId(event.tenantId)
            }))
        );

        await domainEventRepository.insert(domainEventEntities);
    }

    private resolveRepository(transactionContext: EntityManager | null): Repository<SerializedDomainEvent> {
        return transactionContext?.getRepository(this.domainEventRepository.target) ?? this.domainEventRepository;
    }
}
