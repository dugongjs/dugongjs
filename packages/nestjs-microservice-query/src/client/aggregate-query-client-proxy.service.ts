import type {
    AggregateQueryOptions,
    GetAggregateOptions,
    IAggregateQueryService,
    SerializedDomainEvent
} from "@dugongjs/core";
import { Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";
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

@Injectable()
export class AggregateQueryClientProxyService implements IAggregateQueryService {
    constructor(private readonly queryClientProxy: ClientProxy) {}

    public async getAggregateTypes(): Promise<string[]> {
        return await firstValueFrom(this.queryClientProxy.send(GET_AGGREGATE_TYPES_TOKEN, {}));
    }

    public async getAggregateIds(
        origin: string | null,
        aggregateType: string,
        options: AggregateQueryOptions = {}
    ): Promise<string[]> {
        const request: AggregateQueryRequest = {
            origin,
            aggregateType,
            tenantScope: options.tenantScope
        };

        return await firstValueFrom(this.queryClientProxy.send(GET_AGGREGATE_IDS_TOKEN, request));
    }

    public async getAggregate(
        origin: string | null,
        aggregateType: string,
        aggregateId: string,
        options: GetAggregateOptions = {}
    ): Promise<object | null> {
        const request: GetAggregateRequest = {
            origin,
            aggregateType,
            aggregateId,
            tenantScope: options.tenantScope,
            toSequenceNumber: options.toSequenceNumber
        };

        const aggregate = await firstValueFrom(this.queryClientProxy.send(GET_AGGREGATE_TOKEN, request));

        if (aggregate === null) {
            return null;
        }

        return JSON.parse(aggregate);
    }

    public async getDomainEventsForAggregate(
        origin: string | null,
        aggregateType: string,
        aggregateId: string,
        options: AggregateQueryOptions = {}
    ): Promise<SerializedDomainEvent[]> {
        const request: GetDomainEventsForAggregateRequest = {
            origin,
            aggregateType,
            aggregateId,
            tenantScope: options.tenantScope
        };

        return await firstValueFrom(this.queryClientProxy.send(GET_DOMAIN_EVENTS_FOR_AGGREGATE_TOKEN, request));
    }

    public async close(): Promise<void> {
        await this.queryClientProxy.close();
    }
}
