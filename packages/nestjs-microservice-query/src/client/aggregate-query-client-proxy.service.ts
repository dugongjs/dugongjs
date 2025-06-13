import type { IAggregateQueryService, SerializedDomainEvent } from "@dugongjs/core";
import { Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";
import {
    GET_AGGREGATE_IDS_TOKEN,
    GET_AGGREGATE_TOKEN,
    GET_AGGREGATE_TYPES_TOKEN,
    GET_DOMAIN_EVENTS_FOR_AGGREGATE_TOKEN
} from "../tokens/aggregate-query.tokens.js";

@Injectable()
export class AggregateQueryClientProxyService implements IAggregateQueryService {
    constructor(private readonly queryClientProxy: ClientProxy) {}

    public async getAggregateTypes(): Promise<string[]> {
        return await firstValueFrom(this.queryClientProxy.send(GET_AGGREGATE_TYPES_TOKEN, {}));
    }

    public async getAggregateIds(origin: string | null, aggregateType: string, tenantId?: string): Promise<string[]> {
        return await firstValueFrom(
            this.queryClientProxy.send(GET_AGGREGATE_IDS_TOKEN, [origin, aggregateType, tenantId])
        );
    }

    public async getAggregate(
        origin: string | null,
        aggregateType: string,
        aggregateId: string,
        tenantId?: string | null,
        toSequenceNumber?: number
    ): Promise<object | null> {
        const aggregate = await firstValueFrom(
            this.queryClientProxy.send(GET_AGGREGATE_TOKEN, [
                origin,
                aggregateType,
                aggregateId,
                tenantId,
                toSequenceNumber
            ])
        );

        if (aggregate === null) {
            return null;
        }

        return JSON.parse(aggregate);
    }

    public async getDomainEventsForAggregate(
        origin: string | null,
        aggregateType: string,
        aggregateId: string,
        tenantId?: string | null
    ): Promise<SerializedDomainEvent[]> {
        return await firstValueFrom(
            this.queryClientProxy.send(GET_DOMAIN_EVENTS_FOR_AGGREGATE_TOKEN, [
                origin,
                aggregateType,
                aggregateId,
                tenantId
            ])
        );
    }

    public async close(): Promise<void> {
        await this.queryClientProxy.close();
    }
}
