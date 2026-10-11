import type { ISnapshotRepository, SerializedSnapshot } from "@dugongjs/core";
import type { EntityManager, FindOptionsWhere, Repository } from "typeorm";
import { denormalizeTenantId, normalizeTenantId } from "../../../infrastructure/db/no-tenant-id.js";

export class SnapshotRepositoryTypeOrm implements ISnapshotRepository {
    constructor(private readonly snapshotRepository: Repository<SerializedSnapshot>) {}

    public async getLatestSnapshot(
        transactionContext: EntityManager | null,
        origin: string,
        aggregateType: string,
        aggregateId: string,
        tenantId?: string
    ): Promise<SerializedSnapshot | null> {
        const snapshotRepository = this.resolveRepository(transactionContext);

        const where: FindOptionsWhere<SerializedSnapshot> = {
            origin,
            aggregateType,
            aggregateId
        };

        if (tenantId !== undefined) {
            where.tenantId = normalizeTenantId(tenantId);
        }

        const snapshot = await snapshotRepository.findOne({
            where,
            order: {
                domainEventSequenceNumber: "DESC"
            }
        });

        return snapshot
            ? {
                  ...snapshot,
                  tenantId: denormalizeTenantId(snapshot.tenantId)
              }
            : null;
    }

    public async saveSnapshot(transactionContext: EntityManager | null, snapshot: SerializedSnapshot): Promise<void> {
        const snapshotRepository = this.resolveRepository(transactionContext);

        await snapshotRepository.save({
            ...snapshot,
            tenantId: normalizeTenantId(snapshot.tenantId)
        });
    }

    private resolveRepository(transactionContext: EntityManager | null): Repository<SerializedSnapshot> {
        return transactionContext?.getRepository(this.snapshotRepository.target) ?? this.snapshotRepository;
    }
}
