import { ConsumedMessageEntity, DomainEventEntity, OutboxEntity, SnapshotEntity } from "@dugongjs/typeorm/driver/sqlite";
import { createOutboxMessageProducerTypeOrmAdapter } from "../../adapters/outbox-message-producer-typeorm.adapter.js";
import { createRepositoryTypeOrmAdapter } from "../../adapters/repository-typeorm.adapter.js";
import { createOutboxMessageProducerTypeOrmModule } from "../../modules/outbox-message-producer-typeorm/outbox-message-producer-typeorm.module.js";
import { createRepositoryTypeOrmModule } from "../../modules/repository-typeorm/repository-typeorm.module.js";
import type { TypeOrmEntities } from "../../types/index.js";

const entities: TypeOrmEntities = {
    consumedMessage: ConsumedMessageEntity,
    domainEvent: DomainEventEntity,
    outbox: OutboxEntity,
    snapshot: SnapshotEntity
};

export const RepositoryTypeOrmModule = createRepositoryTypeOrmModule(entities);
export const OutboxMessageProducerTypeOrmModule = createOutboxMessageProducerTypeOrmModule(entities);
export const repositoryTypeOrmAdapter = createRepositoryTypeOrmAdapter(entities);
export const outboxMessageProducerTypeOrmAdapter = createOutboxMessageProducerTypeOrmAdapter(entities);
