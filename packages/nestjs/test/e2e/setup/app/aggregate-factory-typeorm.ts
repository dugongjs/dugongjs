import {
    AbstractAggregateRoot,
    AggregateFactory,
    type AggregateFactoryOptions,
    type RemoveAbstract
} from "@dugongjs/core";
import { DomainEventRepositoryTypeOrm } from "../../../../src/adapters/outbound/repository/domain-event-repository-typeorm.js";
import { SnapshotRepositoryTypeOrm } from "../../../../src/adapters/outbound/repository/snapshot-repository-typeorm.js";
import { DomainEventEntity } from "../../../../src/infrastructure/db/entities/domain-event.entity.js";
import { SnapshotEntity } from "../../../../src/infrastructure/db/entities/snapshot.entity.js";
import { dataSource } from "../setup/data-source.js";
import { Logger } from "./logger.js";

export type AggregateFactoryTypeOrmOptions<TAggregateRootClass extends RemoveAbstract<typeof AbstractAggregateRoot>> =
    Omit<AggregateFactoryOptions<TAggregateRootClass>, "domainEventRepository" | "snapshotRepository" | "logger">;

export class AggregateFactoryTypeOrm<
    TAggregateRootClass extends RemoveAbstract<typeof AbstractAggregateRoot>
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
