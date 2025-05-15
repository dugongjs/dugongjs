import type { AbstractAggregateRoot, Constructor, HandleMessageContext } from "@dugongjs/core";
import { Inject, Injectable } from "@nestjs/common";
import { EventSourcingService } from "../event-sourcing/event-sourcing.service.js";
import { IQueryModelProjectionHandler } from "./i-query-model-projection-handler.js";

@Injectable()
export class QueryModelProjectionConsumerService {
    constructor(
        private readonly eventSourcingService: EventSourcingService,
        @Inject(IQueryModelProjectionHandler)
        private readonly queryModelProjectionHandler: IQueryModelProjectionHandler<any>
    ) {}

    public getAggregateClass(): Constructor<AbstractAggregateRoot> {
        return this.queryModelProjectionHandler.getAggregateClass();
    }

    public async updateQueryModel(context: HandleMessageContext): Promise<void> {
        const aggregateContext = this.eventSourcingService.createAggregateContext(
            context.transactionContext,
            this.queryModelProjectionHandler.getAggregateClass()
        );

        const aggregateId = context.domainEvent.getAggregateId();

        const aggregate = await aggregateContext.build(aggregateId, { returnDeleted: true });

        if (!aggregate) {
            return;
        }

        if (aggregate.isDeleted()) {
            return this.queryModelProjectionHandler.deleteQueryModel(context.transactionContext, aggregateId);
        }

        return this.queryModelProjectionHandler.updateQueryModel(context.transactionContext, aggregate);
    }
}
