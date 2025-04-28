import {
    IConsumedMessageRepository,
    IDomainEventRepository,
    IMessageProducer,
    ISnapshotRepository,
    ITransactionManager
} from "@dugongjs/core";
import { Module, type DynamicModule } from "@nestjs/common";
import type {
    ConsumedMessageRepositoryProvider,
    DomainEventRepositoryProvider,
    MessageProducerProvider,
    ModuleInjectables,
    SnapshotRepositoryProvider,
    TransactionManagerProvider
} from "../module-providers.js";
import { EventSourcingService } from "../services/event-sourcing.service.js";

export type EventSourcingModuleOptions = {
    global?: boolean;
    module?: ModuleInjectables;
    transactionManager?: Partial<TransactionManagerProvider>;
    repository?: Partial<DomainEventRepositoryProvider> &
        Partial<SnapshotRepositoryProvider> &
        Partial<ConsumedMessageRepositoryProvider>;
    messageBroker?: Partial<MessageProducerProvider>;
};

@Module({
    providers: [EventSourcingService],
    exports: [EventSourcingService]
})
export class EventSourcingModule {
    public static register(options?: EventSourcingModuleOptions): DynamicModule {
        const imports = options?.module?.imports ?? [];
        const providers = options?.module?.providers ?? [];

        if (options?.transactionManager?.transactionManager) {
            providers.push({
                provide: ITransactionManager,
                useClass: options.transactionManager.transactionManager
            });
        }

        if (options?.repository?.domainEventRepository) {
            providers.push({
                provide: IDomainEventRepository,
                useClass: options.repository.domainEventRepository
            });
        }

        if (options?.repository?.snapshotRepository) {
            providers.push({
                provide: ISnapshotRepository,
                useClass: options.repository.snapshotRepository
            });
        }

        if (options?.repository?.consumedMessageRepository) {
            providers.push({
                provide: IConsumedMessageRepository,
                useClass: options?.repository.consumedMessageRepository
            });
        }

        if (options?.messageBroker?.messageProducer) {
            providers.push({
                provide: IMessageProducer,
                useClass: options.messageBroker.messageProducer
            });
        }

        return {
            global: options?.global,
            module: EventSourcingModule,
            imports,
            providers
        };
    }
}
