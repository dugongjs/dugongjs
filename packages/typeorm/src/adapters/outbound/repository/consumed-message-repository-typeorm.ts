import type { IConsumedMessageRepository } from "@dugongjs/core";
import type { EntityManager, Repository } from "typeorm";
import { ConsumedMessageEntity } from "../../../infrastructure/db/entities/consumed-message.js";

export class ConsumedMessageRepositoryTypeOrm implements IConsumedMessageRepository {
    constructor(private readonly consumedMessageRepository: Repository<ConsumedMessageEntity>) {}

    public async checkIfMessageIsConsumed(
        transactionContext: EntityManager | null,
        domainEventId: string,
        consumerId: string
    ): Promise<boolean> {
        const consumedMessageRepository =
            transactionContext?.getRepository(ConsumedMessageEntity) ?? this.consumedMessageRepository;

        const consumedMessage = await consumedMessageRepository.findOne({
            where: {
                domainEventId,
                consumerId
            }
        });

        return !!consumedMessage;
    }

    public async markMessageAsConsumed(
        transactionContext: EntityManager | null,
        domainEventId: string,
        consumerId: string
    ): Promise<void> {
        const consumedMessageRepository =
            transactionContext?.getRepository(ConsumedMessageEntity) ?? this.consumedMessageRepository;

        await consumedMessageRepository.save({
            domainEventId,
            consumerId
        });
    }
}
