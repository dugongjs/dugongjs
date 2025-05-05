import {
    AbstractAggregateRoot,
    AggregateManager,
    type AggregateManagerOptions,
    type RemoveAbstract
} from "@dugongjs/core";
import { OutboxMessageSerdesTypeOrm } from "../../../../src/adapters/common/message-broker/outbox-message-serdes-typeorm.js";
import { OutboxMessageProducerTypeOrm } from "../../../../src/adapters/outbound/message-broker/outbox-message-producer-typeorm.js";
import { DomainEventRepositoryTypeOrm } from "../../../../src/adapters/outbound/repository/domain-event-repository-typeorm.js";
import { SnapshotRepositoryTypeOrm } from "../../../../src/adapters/outbound/repository/snapshot-repository-typeorm.js";
import { DomainEventEntity } from "../../../../src/infrastructure/db/entities/domain-event.entity.js";
import { OutboxEntity } from "../../../../src/infrastructure/db/entities/outbox-entity.js";
import { SnapshotEntity } from "../../../../src/infrastructure/db/entities/snapshot.entity.js";
import { dataSource } from "../setup/data-source.js";
import { Logger } from "./logger.js";

export type AggregateManagerTypeOrmOptions<TAggregateRootClass extends RemoveAbstract<typeof AbstractAggregateRoot>> =
    Omit<
        AggregateManagerOptions<TAggregateRootClass>,
        "domainEventRepository" | "snapshotRepository" | "messageProducer" | "logger"
    >;

export class AggregateManagerTypeOrm<
    TAggregateRootClass extends RemoveAbstract<typeof AbstractAggregateRoot>
> extends AggregateManager<TAggregateRootClass> {
    constructor(options: AggregateManagerTypeOrmOptions<TAggregateRootClass>) {
        super({
            ...options,
            domainEventRepository: new DomainEventRepositoryTypeOrm(dataSource.getRepository(DomainEventEntity)),
            snapshotRepository: new SnapshotRepositoryTypeOrm(dataSource.getRepository(SnapshotEntity)),
            messageProducer: new OutboxMessageProducerTypeOrm(dataSource.getRepository(OutboxEntity)),
            messageSerdes: new OutboxMessageSerdesTypeOrm(),
            logger: new Logger()
        });
    }
}
