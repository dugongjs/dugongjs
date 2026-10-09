import type { SerializedDomainEvent, SerializedSnapshot } from "@dugongjs/core";
import type { DataSourceOptions, EntityTarget } from "typeorm";
import type { ConsumedMessageRecord, OutboxRecord } from "../../../../src/index.js";

export type DriverName = "postgres" | "sqlite";

export type DriverEntities = {
    consumedMessage: EntityTarget<ConsumedMessageRecord>;
    domainEvent: EntityTarget<SerializedDomainEvent>;
    outbox: EntityTarget<OutboxRecord>;
    snapshot: EntityTarget<SerializedSnapshot>;
};

export type Driver = {
    name: DriverName;
    entities: DriverEntities;
    createDataSourceOptions: () => DataSourceOptions;
    supportsConcurrentConnections: boolean;
};
