import type { IDomainEventRepository, SerializedDomainEvent } from "@dugongjs/core";
import { MoreThan, type EntityManager, type Repository } from "typeorm";
import { DomainEventEntity } from "../../../infrastructure/db/entities/domain-event.entity.js";

export class DomainEventRepositoryTypeOrm implements IDomainEventRepository {
    constructor(private readonly domainEventRepository: Repository<DomainEventEntity>) {}

    public async getAggregateDomainEvents(
        transactionContext: EntityManager | null,
        origin: string,
        aggregateType: string,
        aggregateId: string,
        fromSequenceNumber?: number
    ): Promise<SerializedDomainEvent[]> {
        const domainEventRepository =
            transactionContext?.getRepository(DomainEventEntity) ?? this.domainEventRepository;

        const serializedDomainEvents = await domainEventRepository.find({
            where: {
                origin,
                aggregateType,
                aggregateId,
                sequenceNumber: fromSequenceNumber ? MoreThan(fromSequenceNumber) : undefined
            },
            order: {
                sequenceNumber: "ASC"
            }
        });

        return serializedDomainEvents;
    }

    public async getAggregateIds(
        transactionContext: EntityManager | null,
        origin: string,
        aggregateType: string
    ): Promise<string[]> {
        const domainEventRepository =
            transactionContext?.getRepository(DomainEventEntity) ?? this.domainEventRepository;

        const aggregateIds = await domainEventRepository
            .createQueryBuilder("domainEvent")
            .select("DISTINCT domainEvent.aggregateId", "aggregateId")
            .where("domainEvent.origin = :origin", { origin })
            .andWhere("domainEvent.aggregateType = :aggregateType", { aggregateType })
            .orderBy("domainEvent.aggregateId", "ASC")
            .getRawMany();

        return aggregateIds;
    }

    public async saveDomainEvents(
        transactionContext: EntityManager | null,
        events: SerializedDomainEvent[]
    ): Promise<void> {
        const domainEventRepository =
            transactionContext?.getRepository(DomainEventEntity) ?? this.domainEventRepository;

        await domainEventRepository.save(events);
    }
}
