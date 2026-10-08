import { DomainEventEntity, SnapshotEntity } from "../../../../src/driver/postgres/index.js";
import { AggregateFactory, type AggregateFactoryOptions, type AggregateRoot } from "@dugongjs/core";
import { DomainEventRepositoryTypeOrm } from "../../../../src/adapters/outbound/repository/domain-event-repository-typeorm.js";
import { SnapshotRepositoryTypeOrm } from "../../../../src/adapters/outbound/repository/snapshot-repository-typeorm.js";
import { dataSource } from "../setup/data-source.js";
import { Logger } from "./logger.js";

export type AggregateFactoryTypeOrmOptions<TAggregateRootClass extends AggregateRoot> = Omit<
    AggregateFactoryOptions<TAggregateRootClass>,
    "domainEventRepository" | "snapshotRepository" | "logger"
>;

export class AggregateFactoryTypeOrm<
    TAggregateRootClass extends AggregateRoot
> extends AggregateFactory<TAggregateRootClass> {
    constructor(options: AggregateFactoryTypeOrmOptions<TAggregateRootClass>) {
        super({
            ...options,
            domainEventRepository: new DomainEventRepositoryTypeOrm(dataSource.getRepository(DomainEventEntity)),
            snapshotRepository: new SnapshotRepositoryTypeOrm(dataSource.getRepository(SnapshotEntity)),
            logger: new Logger()
        });
    }
}
