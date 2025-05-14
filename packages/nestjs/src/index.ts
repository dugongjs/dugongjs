export { AggregateQueryService } from "./aggregate-query/aggregate-query.service.js";
export { InjectConsumedMessageRepository } from "./decorators/inject-comsumed-message-repository.decorator.js";
export { InjectCurrentOrigin } from "./decorators/inject-current-origin.decorator.js";
export { InjectDomainEventRepository } from "./decorators/inject-domain-event-repository.decorator.js";
export { InjectMessageConsumer } from "./decorators/inject-message-consumer.decorator.js";
export { InjectMessageProducer } from "./decorators/inject-message-producer.decorator.js";
export { InjectSnapshotRepository } from "./decorators/inject-snapshot-repository.decorator.js";
export { InjectTransactionManager } from "./decorators/inject-transaction-manager.decorator.js";
export { EventIssuerModule, type EventIssuerModuleOptions } from "./event-issuer/event-issuer.module.js";
export { EventSourcingModule, type EventSourcingModuleOptions } from "./event-sourcing/event-sourcing.module.js";
export { EventSourcingService } from "./event-sourcing/event-sourcing.service.js";
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
} from "./providers/module-providers.js";
