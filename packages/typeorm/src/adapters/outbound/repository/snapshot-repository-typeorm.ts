import type { ISnapshotRepository, SerializedSnapshot } from "@dugongjs/core";
import type { EntityManager, Repository } from "typeorm";
import { SnapshotEntity } from "../../../infrastructure/db/entities/snapshot.entity.js";

export class SnapshotRepositoryTypeOrm implements ISnapshotRepository {
    constructor(private readonly snapshotRepository: Repository<SnapshotEntity>) {}

    public async getLatestSnapshot(
        transactionContext: EntityManager | null,
        origin: string,
        aggregateType: string,
        aggregateId: string,
        tenantId?: string
    ): Promise<SerializedSnapshot | null> {
        const snapshotRepository = transactionContext?.getRepository(SnapshotEntity) ?? this.snapshotRepository;

        const snapshot = await snapshotRepository.findOne({
            where: {
                origin,
                aggregateType,
                aggregateId,
                tenantId
            },
            order: {
                domainEventSequenceNumber: "DESC"
            }
        });

        return snapshot ? snapshot : null;
    }

    public async saveSnapshot(transactionContext: EntityManager | null, snapshot: SerializedSnapshot): Promise<void> {
        const snapshotRepository = transactionContext?.getRepository(SnapshotEntity) ?? this.snapshotRepository;

        await snapshotRepository.save(snapshot);
    }
}
