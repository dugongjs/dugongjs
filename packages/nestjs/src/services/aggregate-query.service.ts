import { AggregateQueryService as AggregateQueryServiceInternal, IDomainEventRepository } from "@dugongjs/core";
import { Logger } from "@nestjs/common";
import { InjectCurrentOrigin } from "../decorators/inject-current-origin.decorator.js";
import { InjectDomainEventRepository } from "../decorators/inject-domain-event-repository.decorator.js";

export class AggregateQueryService extends AggregateQueryServiceInternal {
    constructor(
        @InjectCurrentOrigin() currentOrigin: string,
        @InjectDomainEventRepository() domainEventRepository: IDomainEventRepository
    ) {
        super({
            currentOrigin,
            domainEventRepository,
            logger: new Logger(AggregateQueryService.name)
        });
    }
}
