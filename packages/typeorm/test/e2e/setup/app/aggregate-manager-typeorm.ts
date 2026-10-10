import { AggregateManager, type AggregateManagerOptions, type AggregateRoot } from "@dugongjs/core";
import { OutboxMessageMapperTypeOrm } from "../../../../src/adapters/outbound/message-broker/outbox-message-mapper-typeorm.js";
import { OutboxMessageProducerTypeOrm } from "../../../../src/adapters/outbound/message-broker/outbox-message-producer-typeorm.js";
import { DomainEventRepositoryTypeOrm } from "../../../../src/adapters/outbound/repository/domain-event-repository-typeorm.js";
import { SnapshotRepositoryTypeOrm } from "../../../../src/adapters/outbound/repository/snapshot-repository-typeorm.js";
import { activeDriver } from "../drivers/active-driver.js";
import { dataSource } from "../setup/data-source.js";
import { Logger } from "./logger.js";

export type AggregateManagerTypeOrmOptions<TAggregateRootClass extends AggregateRoot> = Omit<
    AggregateManagerOptions<TAggregateRootClass>,
    "domainEventRepository" | "snapshotRepository" | "messageProducer" | "logger"
>;

export class AggregateManagerTypeOrm<
    TAggregateRootClass extends AggregateRoot
> extends AggregateManager<TAggregateRootClass> {
    constructor(options: AggregateManagerTypeOrmOptions<TAggregateRootClass>) {
        super({
            ...options,
            domainEventRepository: new DomainEventRepositoryTypeOrm(
                dataSource.getRepository(activeDriver.entities.domainEvent)
            ),
            snapshotRepository: new SnapshotRepositoryTypeOrm(dataSource.getRepository(activeDriver.entities.snapshot)),
            messageProducer: new OutboxMessageProducerTypeOrm(dataSource.getRepository(activeDriver.entities.outbox)),
            outboundMessageMapper: new OutboxMessageMapperTypeOrm(),
            logger: new Logger()
        });
    }
}
