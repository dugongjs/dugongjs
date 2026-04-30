import type { IConsumedMessageRepository } from "@dugongjs/core";
import type { EntityManager, Repository } from "typeorm";
import { ConsumedMessageEntity } from "../../../infrastructure/db/entities/consumed-message.js";
import { normalizeTenantId } from "../../../infrastructure/db/no-tenant-id.js";

export class ConsumedMessageRepositoryTypeOrm implements IConsumedMessageRepository {
    constructor(private readonly consumedMessageRepository: Repository<ConsumedMessageEntity>) {}

    public async checkIfMessageIsConsumed(
        transactionContext: EntityManager | null,
        domainEventId: string,
        consumerId: string,
        tenantId?: string
    ): Promise<boolean> {
        const consumedMessageRepository =
            transactionContext?.getRepository(ConsumedMessageEntity) ?? this.consumedMessageRepository;

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
        const consumedMessageRepository =
            transactionContext?.getRepository(ConsumedMessageEntity) ?? this.consumedMessageRepository;

        await consumedMessageRepository.insert({
            domainEventId,
            consumerId,
            tenantId: normalizeTenantId(tenantId)
        });
    }
}
