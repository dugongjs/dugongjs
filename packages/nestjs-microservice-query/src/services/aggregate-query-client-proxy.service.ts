import type { IAggregateQueryService, SerializedDomainEvent } from "@dugongjs/core";
import { Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";
import {
    GET_AGGREGATE_IDS_TOKEN,
    GET_AGGREGATE_TOKEN,
    GET_AGGREGATE_TYPES_TOKEN,
    GET_DOMAIN_EVENTS_FOR_AGGREGATE_TOKEN
} from "../modules/aggregate-query-microservice/aggregate-query.tokens.js";

@Injectable()
export class AggregateQueryClientProxyService implements IAggregateQueryService {
    constructor(private readonly queryClientProxy: ClientProxy) {}

    public async getAggregateTypes(): Promise<string[]> {
        return await firstValueFrom(this.queryClientProxy.send(GET_AGGREGATE_TYPES_TOKEN, {}));
    }

    public async getAggregateIds(origin: string | null, aggregateType: string): Promise<string[]> {
        return await firstValueFrom(this.queryClientProxy.send(GET_AGGREGATE_IDS_TOKEN, [origin, aggregateType]));
    }

    public async getAggregate(
        origin: string | null,
        aggregateType: string,
        aggregateId: string,
        toSequenceNumber?: number
    ): Promise<object | null> {
        return await firstValueFrom(
            this.queryClientProxy.send(GET_AGGREGATE_TOKEN, [origin, aggregateType, aggregateId, toSequenceNumber])
        );
    }

    public async getDomainEventsForAggregate(
        origin: string | null,
        aggregateType: string,
        aggregateId: string
    ): Promise<SerializedDomainEvent[]> {
        return await firstValueFrom(
            this.queryClientProxy.send(GET_DOMAIN_EVENTS_FOR_AGGREGATE_TOKEN, [origin, aggregateType, aggregateId])
        );
    }
}
