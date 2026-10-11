import type { IConsumedMessageRepository } from "@dugongjs/core";
import type { EntityManager, Repository } from "typeorm";
import { normalizeTenantId } from "../../../infrastructure/db/no-tenant-id.js";
import type { ConsumedMessageRecord } from "../../../infrastructure/db/records/consumed-message-record.js";

export class ConsumedMessageRepositoryTypeOrm implements IConsumedMessageRepository {
    constructor(private readonly consumedMessageRepository: Repository<ConsumedMessageRecord>) {}

    public async checkIfMessageIsConsumed(
        transactionContext: EntityManager | null,
        domainEventId: string,
        consumerId: string,
        tenantId?: string
    ): Promise<boolean> {
        const consumedMessageRepository = this.resolveRepository(transactionContext);

        const consumedMessage = await consumedMessageRepository.findOne({
            where: {
                domainEventId,
                consumerId,
                tenantId: normalizeTenantId(tenantId)
            }
        });

        return !!consumedMessage;
    }

    public async markMessageAsConsumed(
        transactionContext: EntityManager | null,
        domainEventId: string,
        consumerId: string,
        tenantId?: string
    ): Promise<void> {
        const consumedMessageRepository = this.resolveRepository(transactionContext);

        await consumedMessageRepository.insert({
            domainEventId,
            consumerId,
            tenantId: normalizeTenantId(tenantId)
        });
    }

    private resolveRepository(transactionContext: EntityManager | null): Repository<ConsumedMessageRecord> {
        return (
            transactionContext?.getRepository(this.consumedMessageRepository.target) ?? this.consumedMessageRepository
        );
    }
}
