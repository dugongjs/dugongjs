import {
    ConsumedMessageEntity,
    DomainEventEntity,
    OutboxEntity,
    SnapshotEntity
} from "@dugongjs/typeorm/driver/postgres";
import {
    OutboxMessageProducerTypeOrmModule,
    outboxMessageProducerTypeOrmAdapter,
    RepositoryTypeOrmModule,
    repositoryTypeOrmAdapter
} from "../../../../src/driver/postgres/index.js";
import type { Driver } from "./driver.js";

export const postgresDriver: Driver = {
    name: "postgres",
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
    supportsConcurrentConnections: true,
    createDataSourceOptions: () => ({
        type: "postgres",
        schema: "public",
        port: +process.env.DB_PORT!,
        host: process.env.DB_HOST!,
        username: process.env.DB_USERNAME!,
        password: process.env.DB_PASSWORD!,
        database: process.env.DB_NAME!,
        entities: [DomainEventEntity, SnapshotEntity, ConsumedMessageEntity, OutboxEntity],
        synchronize: true
    })
};
