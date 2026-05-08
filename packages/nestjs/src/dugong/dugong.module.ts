import {
    IConsumedMessageRepository,
    IDomainEventRepository,
    IExternalOriginMap,
    IInboundMessageMapper,
    IMessageConsumer,
    IMessageProducer,
    IOutboundMessageMapper,
    ISnapshotRepository,
    ITransactionManager
} from "@dugongjs/core";
import {
    Module,
    type ClassProvider,
    type DynamicModule,
    type FactoryProvider,
    type Provider,
    type Type,
    type ValueProvider
} from "@nestjs/common";
import { AggregateDomainEventConsumerModule } from "../aggregate-domain-event-consumer/aggregate-domain-event-consumer.module.js";
import { EventIssuerModule } from "../event-issuer/event-issuer.module.js";
import { ILoggerFactory } from "../logger/i-logger-factory.js";
import type { ModuleInjectables } from "../providers/module-providers.js";
import type { DugongAdapters } from "./dugong-adapter.js";

export type DugongExternalOriginsOptions = {
    module?: ModuleInjectables;
    externalOriginMap:
        | Omit<FactoryProvider<IExternalOriginMap>, "provide">
        | Omit<ClassProvider<IExternalOriginMap>, "provide">
        | Omit<ValueProvider<IExternalOriginMap>, "provide">;
};

export type DugongModuleOptions = {
    currentOrigin: string;
    adapters: DugongAdapters;
    aggregateDomainEventConsumers?: boolean;
    externalOrigins?: DugongExternalOriginsOptions;
};

@Module({})
export class DugongModule {
    public static register(options: DugongModuleOptions): DynamicModule {
        const adapters = options.adapters ?? {};
        const includeAggregateDomainEventConsumers =
            options.aggregateDomainEventConsumers ?? this.canRegisterAggregateDomainEventConsumers(adapters);

        const providers = new ProviderBuilder()
            .withClassProvider(ILoggerFactory, adapters.loggerFactory)
            .withClassProvider(IDomainEventRepository, adapters.domainEventRepository)
            .withClassProvider(ISnapshotRepository, adapters.snapshotRepository)
            .withClassProvider(IConsumedMessageRepository, adapters.consumedMessageRepository)
            .withClassProvider(ITransactionManager, adapters.transactionManager)
            .withClassProvider(IMessageConsumer, adapters.messageConsumer)
            .withClassProvider(IInboundMessageMapper, adapters.inboundMessageMapper)
            .withClassProvider(IMessageProducer, adapters.messageProducer)
            .withClassProvider(IOutboundMessageMapper, adapters.outboundMessageMapper)
            .build();

        const allProviders = [
            ...providers,
            ...this.createExternalOriginMapProviders(options.externalOrigins),
            ...(options.externalOrigins?.module?.providers ?? []),
            ...(adapters.providers ?? [])
        ];

        return {
            module: DugongModule,
            imports: [
                EventIssuerModule.forRoot({ currentOrigin: options.currentOrigin }),
                ...(options.externalOrigins?.module?.imports ?? []),
                ...(includeAggregateDomainEventConsumers ? [AggregateDomainEventConsumerModule] : []),
                ...(adapters.imports ?? [])
            ],
            providers: allProviders,
            exports: allProviders
        };
    }

    public static forRoot(options: DugongModuleOptions): DynamicModule {
        const module = this.register(options);

        return {
            ...module,
            global: true
        };
    }

    private static canRegisterAggregateDomainEventConsumers(adapters: DugongAdapters): boolean {
        return (
            adapters.transactionManager !== undefined &&
            adapters.domainEventRepository !== undefined &&
            adapters.consumedMessageRepository !== undefined &&
            adapters.messageConsumer !== undefined &&
            adapters.inboundMessageMapper !== undefined
        );
    }

    private static createExternalOriginMapProviders(options: DugongExternalOriginsOptions | undefined): Provider[] {
        if (!options) {
            return [];
        }

        return [
            {
                provide: IExternalOriginMap,
                ...options.externalOriginMap
            }
        ];
    }
}

class ProviderBuilder {
    private providers: Provider[] = [];

    public withClassProvider(token: string | Type, provider: Type | undefined): this {
        if (provider) {
            this.providers.push({
                provide: token,
                useClass: provider
            });
        }
        return this;
    }

    public build(): Provider[] {
        return this.providers;
    }
}
