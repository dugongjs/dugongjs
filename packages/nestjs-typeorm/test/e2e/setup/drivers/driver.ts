import type { DugongAdapters } from "@dugongjs/nestjs";
import type { DataSourceOptions } from "typeorm";
import type { TypeOrmEntities, TypeOrmFeatureModule } from "../../../../src/types/index.js";

export type DriverName = "postgres" | "sqlite";

export type DriverModules = {
    outboxMessageProducer: TypeOrmFeatureModule;
    repository: TypeOrmFeatureModule;
};

export type DriverAdapters = {
    outboxMessageProducer: DugongAdapters;
    repository: DugongAdapters;
};

export type Driver = {
    name: DriverName;
    entities: TypeOrmEntities;
    modules: DriverModules;
    adapters: DriverAdapters;
    supportsConcurrentConnections: boolean;
    createDataSourceOptions: () => DataSourceOptions;
};
