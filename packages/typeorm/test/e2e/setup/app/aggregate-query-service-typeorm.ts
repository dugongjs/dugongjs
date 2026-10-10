import { AggregateQueryService, type AggregateQueryServiceOptions } from "@dugongjs/core";
import { DomainEventRepositoryTypeOrm } from "../../../../src/index.js";
import { activeDriver } from "../drivers/active-driver.js";
import { dataSource } from "../setup/data-source.js";
import { Logger } from "./logger.js";

export type AggregateQueryServiceTypeOrmOptions = Omit<
    AggregateQueryServiceOptions,
    "domainEventRepository" | "logger"
>;

export class AggregateQueryServiceTypeOrm extends AggregateQueryService {
    constructor(options: AggregateQueryServiceTypeOrmOptions) {
        super({
            ...options,
            domainEventRepository: new DomainEventRepositoryTypeOrm(
                dataSource.getRepository(activeDriver.entities.domainEvent)
            ),
            logger: new Logger()
        });
    }
}
