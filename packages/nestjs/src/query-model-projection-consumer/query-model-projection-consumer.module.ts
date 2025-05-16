import type { Constructor } from "@dugongjs/core";
import { Module, type DynamicModule } from "@nestjs/common";
import { AggregateMessageConsumerService } from "../aggregate-message-consumer/aggregate-message-consumer.service.js";
import { EventSourcingModule } from "../event-sourcing/event-sourcing.module.js";
import type {
    InboundMessageMapperProvider,
    MessageConsumerProvider,
    ModuleInjectables
} from "../providers/module-providers.js";
import { IQueryModelProjectionHandler } from "./i-query-model-projection-handler.js";
import { QueryModelProjectionConsumerController } from "./query-model-projection-consumer.controller.js";
import { QueryModelProjectionConsumerService } from "./query-model-projection-consumer.service.js";

export type QueryModelProjectionConsumerModuleOptions = {
    module?: ModuleInjectables;
    queryModelProjectionHandler: Constructor<IQueryModelProjectionHandler<any>>;
    messageBroker?: Partial<MessageConsumerProvider> & Partial<InboundMessageMapperProvider>;
};

@Module({
    imports: [EventSourcingModule],
    controllers: [QueryModelProjectionConsumerController],
    providers: [QueryModelProjectionConsumerService, AggregateMessageConsumerService]
})
export class QueryModelProjectionConsumerModule {
    public static register(options: QueryModelProjectionConsumerModuleOptions): DynamicModule {
        return {
            module: QueryModelProjectionConsumerModule,
            imports: options.module?.imports,
            providers: [
                ...(options.module?.providers ?? []),
                {
                    provide: IQueryModelProjectionHandler,
                    useClass: options.queryModelProjectionHandler
                }
            ]
        };
    }
}
