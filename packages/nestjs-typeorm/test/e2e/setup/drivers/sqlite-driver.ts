import { ConsumedMessageEntity, DomainEventEntity, OutboxEntity, SnapshotEntity } from "@dugongjs/typeorm/driver/sqlite";
import {
    OutboxMessageProducerTypeOrmModule,
    outboxMessageProducerTypeOrmAdapter,
    RepositoryTypeOrmModule,
    repositoryTypeOrmAdapter
} from "../../../../src/driver/sqlite/index.js";
import type { Driver } from "./driver.js";

export const sqliteDriver: Driver = {
    name: "sqlite",
    entities: {
        consumedMessage: ConsumedMessageEntity,
        domainEvent: DomainEventEntity,
        outbox: OutboxEntity,
        snapshot: SnapshotEntity
    },
    modules: {
        outboxMessageProducer: OutboxMessageProducerTypeOrmModule,
        repository: RepositoryTypeOrmModule
    },
    adapters: {
        outboxMessageProducer: outboxMessageProducerTypeOrmAdapter,
        repository: repositoryTypeOrmAdapter
    },
    supportsConcurrentConnections: false,
    createDataSourceOptions: () => ({
        type: "better-sqlite3",
        database: ":memory:",
        entities: [DomainEventEntity, SnapshotEntity, ConsumedMessageEntity, OutboxEntity],
        synchronize: true
    })
};
