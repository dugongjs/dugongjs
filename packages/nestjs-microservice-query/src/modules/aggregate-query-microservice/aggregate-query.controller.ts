import type { IAggregateQueryService, SerializedDomainEvent } from "@dugongjs/core";
import { AggregateQueryService } from "@dugongjs/nestjs";
import { Controller } from "@nestjs/common";
import { MessagePattern } from "@nestjs/microservices";
import {
    GET_AGGREGATE_IDS_TOKEN,
    GET_AGGREGATE_TOKEN,
    GET_AGGREGATE_TYPES_TOKEN,
    GET_DOMAIN_EVENTS_FOR_AGGREGATE_TOKEN
} from "./aggregate-query.tokens.js";

@Controller()
export class AggregateQueryController {
    constructor(private readonly aggregateQueryService: AggregateQueryService) {}

    @MessagePattern(GET_AGGREGATE_TYPES_TOKEN)
    public getAggregateTypes(): Promise<string[]> {
        return this.aggregateQueryService.getAggregateTypes();
    }

    @MessagePattern(GET_AGGREGATE_IDS_TOKEN)
    public getAggregateIds(args: Parameters<IAggregateQueryService["getAggregateIds"]>): Promise<string[]> {
        return this.aggregateQueryService.getAggregateIds(...args);
    }

    @MessagePattern(GET_AGGREGATE_TOKEN)
    public async getAggregate(args: Parameters<IAggregateQueryService["getAggregate"]>): Promise<string | null> {
        const aggregate = await this.aggregateQueryService.getAggregate(...args);

        if (aggregate === null) {
            return null;
        }

        return JSON.stringify(aggregate);
    }

    @MessagePattern(GET_DOMAIN_EVENTS_FOR_AGGREGATE_TOKEN)
    public getDomainEventsForAggregate(
        args: Parameters<IAggregateQueryService["getDomainEventsForAggregate"]>
    ): Promise<SerializedDomainEvent[]> {
        return this.aggregateQueryService.getDomainEventsForAggregate(...args);
    }
}
