import { AggregateQueryService as AggregateQueryServiceInternal, IDomainEventRepository } from "@dugongjs/core";
import { Optional } from "@nestjs/common";
import { InjectCurrentOrigin } from "../decorators/inject-current-origin.decorator.js";
import { InjectDomainEventRepository } from "../decorators/inject-domain-event-repository.decorator.js";
import { InjectLoggerFactory } from "../decorators/inject-logger-factory.decorator.js";
import type { ILoggerFactory } from "../logger/i-logger-factory.js";

export class AggregateQueryService extends AggregateQueryServiceInternal {
    constructor(
        @InjectCurrentOrigin() currentOrigin: string,
        @InjectDomainEventRepository() domainEventRepository: IDomainEventRepository,
        @Optional() @InjectLoggerFactory() loggerFactory?: ILoggerFactory
    ) {
        super({
            currentOrigin,
            domainEventRepository,
            logger: loggerFactory?.createLogger(AggregateQueryService.name)
        });
    }
}
