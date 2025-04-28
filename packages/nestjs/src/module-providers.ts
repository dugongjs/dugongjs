import type {
    Constructor,
    IConsumedMessageRepository,
    IDomainEventRepository,
    IMessageConsumer,
    IMessageProducer,
    ISnapshotRepository,
    ITransactionManager
} from "@dugongjs/core";
import type { ModuleMetadata } from "@nestjs/common";

export type ModuleImports = { imports?: ModuleMetadata["imports"] };
export type ModuleProviders = { providers?: ModuleMetadata["providers"] };
export type ModuleInjectables = ModuleImports & ModuleProviders;
export type DomainEventRepositoryProvider = { domainEventRepository: Constructor<IDomainEventRepository> };
export type SnapshotRepositoryProvider = { snapshotRepository: Constructor<ISnapshotRepository> };
export type ConsumedMessageRepositoryProvider = { consumedMessageRepository: Constructor<IConsumedMessageRepository> };
export type TransactionManagerProvider = { transactionManager: Constructor<ITransactionManager> };
export type MessageProducerProvider = { messageProducer: Constructor<IMessageProducer> };
export type MessageConsumerProvider = { messageConsumer: Constructor<IMessageConsumer<any>> };
