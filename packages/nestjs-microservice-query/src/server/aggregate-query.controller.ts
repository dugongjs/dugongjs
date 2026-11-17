import type { SerializedDomainEvent } from "@dugongjs/core";
import { AggregateQueryService } from "@dugongjs/nestjs";
import { Controller } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import {
    GET_AGGREGATE_IDS_TOKEN,
    GET_AGGREGATE_TOKEN,
    GET_AGGREGATE_TYPES_TOKEN,
    GET_DOMAIN_EVENTS_FOR_AGGREGATE_TOKEN
} from "../tokens/aggregate-query.tokens.js";
import type {
    AggregateQueryRequest,
    GetAggregateRequest,
    GetDomainEventsForAggregateRequest
} from "../types/aggregate-query-request.type.js";

@Controller()
export class AggregateQueryController {
    constructor(private readonly aggregateQueryService: AggregateQueryService) {}

    @MessagePattern(GET_AGGREGATE_TYPES_TOKEN)
    public getAggregateTypes(): Promise<string[]> {
        return this.aggregateQueryService.getAggregateTypes();
    }

    @MessagePattern(GET_AGGREGATE_IDS_TOKEN)
    public getAggregateIds(@Payload() request: AggregateQueryRequest): Promise<string[]> {
        return this.aggregateQueryService.getAggregateIds(request.origin, request.aggregateType, {
            tenantScope: request.tenantScope
        });
    }

    @MessagePattern(GET_AGGREGATE_TOKEN)
    public async getAggregate(@Payload() request: GetAggregateRequest): Promise<string | null> {
        const aggregate = await this.aggregateQueryService.getAggregate(
            request.origin,
            request.aggregateType,
            request.aggregateId,
            { tenantScope: request.tenantScope, toSequenceNumber: request.toSequenceNumber }
        );

        if (aggregate === null) {
            return null;
        }

        return JSON.stringify(aggregate);
    }

    @MessagePattern(GET_DOMAIN_EVENTS_FOR_AGGREGATE_TOKEN)
    public getDomainEventsForAggregate(
        @Payload() request: GetDomainEventsForAggregateRequest
    ): Promise<SerializedDomainEvent[]> {
        return this.aggregateQueryService.getDomainEventsForAggregate(
            request.origin,
            request.aggregateType,
            request.aggregateId,
            { tenantScope: request.tenantScope }
        );
    }
}
