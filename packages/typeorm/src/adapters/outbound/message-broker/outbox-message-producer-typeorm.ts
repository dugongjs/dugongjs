import type { IMessageProducer } from "@dugongjs/core";
import * as changeCase from "change-case";
import type { EntityManager, Repository } from "typeorm";
import type { OutboxRecord } from "../../../infrastructure/db/records/outbox-record.js";

export class OutboxMessageProducerTypeOrm implements IMessageProducer<OutboxRecord> {
    constructor(private readonly outboxRepository: Repository<OutboxRecord>) {}

    public async publishMessage(
        transactionContext: EntityManager | null,
        messageChannelId: string,
        message: OutboxRecord
    ): Promise<void> {
        const outboxRepository = this.resolveRepository(transactionContext);

        const outboxEntry: OutboxRecord = {
            ...message,
            tenantId: (message.tenantId ?? null) as any,
            channelId: messageChannelId
        };

        await outboxRepository.save(outboxEntry);
    }

    public async publishMessages(
        transactionContext: EntityManager | null,
        messageChannelId: string,
        messages: OutboxRecord[]
    ): Promise<void> {
        const outboxRepository = this.resolveRepository(transactionContext);

        const outboxEntries: OutboxRecord[] = messages.map((message) => ({
            ...message,
            tenantId: (message.tenantId ?? null) as any,
            channelId: messageChannelId
        }));

        await outboxRepository.save(outboxEntries);
    }

    public generateMessageChannelIdForAggregate(origin: string, aggregateType: string): string {
        const originKebab = changeCase.kebabCase(origin);
        const aggregateTypeKebab = changeCase.kebabCase(aggregateType);

        return `${originKebab}-${aggregateTypeKebab}`;
    }

    private resolveRepository(transactionContext: EntityManager | null): Repository<OutboxRecord> {
        return transactionContext?.getRepository(this.outboxRepository.target) ?? this.outboxRepository;
    }
}
