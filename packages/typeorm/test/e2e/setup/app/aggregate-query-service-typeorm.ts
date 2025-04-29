import { AggregateQueryService, type AggregateQueryServiceOptions } from "@dugongjs/core";
import { DomainEventEntity, DomainEventRepositoryTypeOrm } from "../../../../src/index.js";
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
            domainEventRepository: new DomainEventRepositoryTypeOrm(dataSource.getRepository(DomainEventEntity)),
            logger: new Logger()
        });
    }
}
