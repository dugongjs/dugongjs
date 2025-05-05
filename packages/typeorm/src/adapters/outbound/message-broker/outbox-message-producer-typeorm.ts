import type { IMessageProducer } from "@dugongjs/core";
import * as changeCase from "change-case";
import type { EntityManager, Repository } from "typeorm";
import { OutboxEntity } from "../../../infrastructure/db/entities/outbox-entity.js";

export class OutboxMessageProducerTypeOrm implements IMessageProducer<OutboxEntity> {
    constructor(private readonly outboxRepository: Repository<OutboxEntity>) {}

    public async publishMessage(
        transactionContext: EntityManager | null,
        messageChannelId: string,
        message: OutboxEntity
    ): Promise<void> {
        const outboxRepository = transactionContext?.getRepository(OutboxEntity) ?? this.outboxRepository;

        const outboxEntry: OutboxEntity = {
            ...message,
            channelId: messageChannelId
        };

        await outboxRepository.save(outboxEntry);
    }

    public async publishMessages(
        transactionContext: EntityManager | null,
        messageChannelId: string,
        messages: OutboxEntity[]
    ): Promise<void> {
        const outboxRepository = transactionContext?.getRepository(OutboxEntity) ?? this.outboxRepository;

        const outboxEntries: OutboxEntity[] = messages.map((message) => ({
            ...message,
            channelId: messageChannelId
        }));

        await outboxRepository.save(outboxEntries);
    }

    public generateMessageChannelIdForAggregate(origin: string, aggregateType: string): string {
        const originKebab = changeCase.kebabCase(origin);
        const aggregateTypeKebab = changeCase.kebabCase(aggregateType);

        return `${originKebab}-${aggregateTypeKebab}`;
    }
}
