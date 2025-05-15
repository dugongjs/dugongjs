import {
    AbstractEventSourcedAggregateRoot,
    AggregateFactory,
    type AggregateFactoryOptions,
    type RemoveAbstract
} from "@dugongjs/core";
import {
    DomainEventEntity,
    DomainEventRepositoryTypeOrm,
    SnapshotEntity,
    SnapshotRepositoryTypeOrm,
    TransactionManagerTypeOrm
} from "@dugongjs/typeorm";
import { dataSource } from "../setup/data-source.js";
import { Logger } from "./logger.js";

export type AggregateFactoryTypeOrmOptions<
    TAggregateRootClass extends RemoveAbstract<typeof AbstractEventSourcedAggregateRoot>
> = Omit<
    AggregateFactoryOptions<TAggregateRootClass>,
    "transactionManager" | "domainEventRepository" | "snapshotRepository" | "logger"
>;

export class AggregateFactoryTypeOrm<
    TAggregateRootClass extends RemoveAbstract<typeof AbstractEventSourcedAggregateRoot>
> extends AggregateFactory<TAggregateRootClass> {
    constructor(options: AggregateFactoryTypeOrmOptions<TAggregateRootClass>) {
        super({
            ...options,
            transactionManager: new TransactionManagerTypeOrm(dataSource),
            domainEventRepository: new DomainEventRepositoryTypeOrm(dataSource.getRepository(DomainEventEntity)),
            snapshotRepository: new SnapshotRepositoryTypeOrm(dataSource.getRepository(SnapshotEntity)),
            logger: new Logger()
        });
    }
}
