import {
    ConsumedMessageEntity,
    DomainEventEntity,
    OutboxEntity,
    SnapshotEntity
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
    supportsConcurrentConnections: false,
    createDataSourceOptions: () => ({
        type: "better-sqlite3",
        database: ":memory:",
        entities: [DomainEventEntity, SnapshotEntity, ConsumedMessageEntity, OutboxEntity],
        synchronize: true
    })
};
