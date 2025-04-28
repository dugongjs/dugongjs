export { InjectConsumedMessageRepository } from "./decorators/inject-comsumed-message-repository.decorator.js";
export { InjectCurrentOrigin } from "./decorators/inject-current-origin.decorator.js";
export { InjectDomainEventRepository } from "./decorators/inject-domain-event-repository.decorator.js";
export { InjectMessageConsumer } from "./decorators/inject-message-consumer.decorator.js";
export { InjectMessageProducer } from "./decorators/inject-message-producer.decorator.js";
export { InjectSnapshotRepository } from "./decorators/inject-snapshot-repository.decorator.js";
export { InjectTransactionManager } from "./decorators/inject-transaction-manager.decorator.js";
export type {
    ConsumedMessageRepositoryProvider,
    DomainEventRepositoryProvider,
    MessageConsumerProvider,
    MessageProducerProvider,
    ModuleImports,
    ModuleInjectables,
    ModuleProviders,
    SnapshotRepositoryProvider,
    TransactionManagerProvider
} from "./module-providers.js";
