import type { IAggregateQueryService } from "@dugongjs/core";
import { AggregateQueryClientProxyService } from "@dugongjs/nestjs-microservice-query";
import { ClientProxyFactory, Transport as NestJSTransport } from "@nestjs/microservices";
import { getCurrentContext } from "../config/context.js";
import type { Transport } from "../types/context.js";

export type AggregateQueryAdapterWrapper = {
    adapter: IAggregateQueryService;
    close?: () => Promise<void>;
};

export function getAggregateQueryAdapter(): AggregateQueryAdapterWrapper {
    const context = getCurrentContext();

    if (!context) {
        throw new Error("No current context configured. Use 'dugong config use-context <name>' to set a context.");
    }

    switch (context.adapter) {
        case "nestjs-microservices":
            const transportMap: Record<Transport, NestJSTransport> = {
                tcp: NestJSTransport.TCP
            };

            const adapter = new AggregateQueryClientProxyService(
                ClientProxyFactory.create({
                    transport: transportMap[context.transport] as NestJSTransport.TCP,
                    options: {
                        host: context.host,
                        port: context.port
                    }
                })
            );

            return {
                adapter,
                close: () => adapter.close()
            };
        default:
            throw new Error(`Unknown adapter "${context.adapter}".`);
    }
}
