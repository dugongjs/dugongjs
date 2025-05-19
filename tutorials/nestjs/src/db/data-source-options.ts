import { ConsumedMessageEntity, DomainEventEntity, OutboxEntity, SnapshotEntity } from "@dugongjs/typeorm";
import type { DataSourceOptions } from "typeorm";
import { BankAccountQueryModelEntity } from "../bank-account/adapters/repository/bank-account-query-model.entity.js";

export const dataSourceOptions: DataSourceOptions = {
    type: "postgres",
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    synchronize: true,
    logging: false,
    entities: [DomainEventEntity, SnapshotEntity, ConsumedMessageEntity, OutboxEntity, BankAccountQueryModelEntity]
};
