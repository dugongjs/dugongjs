import type {
    Constructor,
    IConsumedMessageRepository,
    IDomainEventRepository,
    IInboundMessageMapper,
    IMessageConsumer,
    IMessageProducer,
    IOutboundMessageMapper,
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
export type MessageProducerProvider = { messageProducer: Constructor<IMessageProducer<any>> };
export type MessageConsumerProvider = { messageConsumer: Constructor<IMessageConsumer<any>> };
export type InboundMessageMapperProvider = { inboundMessageMapper: Constructor<IInboundMessageMapper<any>> };
export type OutboundMessageMapperProvider = { outboundMessageMapper: Constructor<IOutboundMessageMapper<any>> };
