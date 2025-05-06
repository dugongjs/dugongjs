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
    SnapshotRepositoryTypeOrm
} from "@dugongjs/typeorm";
import { dataSource } from "../setup/data-source.js";
import { Logger } from "./logger.js";

export type AggregateFactoryTypeOrmOptions<
    TAggregateRootClass extends RemoveAbstract<typeof AbstractEventSourcedAggregateRoot>
> = Omit<AggregateFactoryOptions<TAggregateRootClass>, "domainEventRepository" | "snapshotRepository" | "logger">;

export class AggregateFactoryTypeOrm<
    TAggregateRootClass extends RemoveAbstract<typeof AbstractEventSourcedAggregateRoot>
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
