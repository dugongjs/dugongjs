import { AggregateQueryService as AggregateQueryServiceInternal, IDomainEventRepository } from "@dugongjs/core";
import { Optional } from "@nestjs/common";
import { InjectCurrentOrigin } from "../decorators/inject-current-origin.decorator.js";
import { InjectDomainEventRepository } from "../decorators/inject-domain-event-repository.decorator.js";
import { InjectLoggerFactory } from "../decorators/inject-logger-factory.decorator.js";
import { InjectRequireTenantScope } from "../decorators/inject-require-tenant-scope.decorator.js";
import type { ILoggerFactory } from "../logger/i-logger-factory.js";

export class AggregateQueryService extends AggregateQueryServiceInternal {
    constructor(
        @InjectCurrentOrigin() currentOrigin: string,
        @InjectDomainEventRepository() domainEventRepository: IDomainEventRepository,
        @Optional() @InjectLoggerFactory() loggerFactory?: ILoggerFactory,
        @Optional() @InjectRequireTenantScope() requireTenantScope?: boolean
    ) {
        super({
            currentOrigin,
            domainEventRepository,
            requireTenantScope: requireTenantScope ?? false,
            logger: loggerFactory?.createLogger(AggregateQueryService.name)
        });
    }
}
