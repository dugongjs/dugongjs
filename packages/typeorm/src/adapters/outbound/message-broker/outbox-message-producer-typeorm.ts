import type { IMessageProducer, SerializedDomainEvent } from "@dugongjs/core";
import * as changeCase from "change-case";
import type { EntityManager, Repository } from "typeorm";
import { OutboxEntity } from "../../../infrastructure/db/entities/outbox-entity.js";

export class OutboxMessageProducerTypeOrm implements IMessageProducer {
    constructor(private readonly outboxRepository: Repository<OutboxEntity>) {}

    public async publishDomainEventsAsMessages(
        transactionContext: EntityManager | null,
        domainEvents: SerializedDomainEvent[],
        messageChannelId: string
    ): Promise<void> {
        const outboxRepository = transactionContext?.getRepository(OutboxEntity) ?? this.outboxRepository;

        const outboxEntries: OutboxEntity[] = domainEvents.map((domainEvent) => ({
            ...domainEvent,
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
