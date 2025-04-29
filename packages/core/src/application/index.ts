export {
    AbstractAggregateHandler,
    type AbstractAggregateHandlerOptions
} from "./abstract-aggregate-handler/abstract-aggregate-handler.js";
export { AggregateContext, type AggregateContextOptions } from "./aggregate-context/aggregate-context.js";
export { AggregateManagerNotAvailableError } from "./aggregate-context/errors/aggregate-manager-not-available-error.js";
export {
    AggregateFactory,
    type AggregateFactoryOptions,
    type BuildOptions
} from "./aggregate-factory/aggregate-factory.js";
export { AggregateMetadataNotFoundError } from "./aggregate-factory/errors/aggregate-metadata-not-found.error.js";
export { MissingAggregateIdError } from "./aggregate-factory/errors/missing-aggregate-id.error.js";
export {
    AggregateManager,
    type AggregateManagerOptions,
    type CommitOptions
} from "./aggregate-manager/aggregate-manager.js";
export {
    AggregateMessageConsumer,
    type AggregateMessageConsumerOptions,
    type HandleMessage,
    type HandleMessageContext,
    type HandleMessageOptions
} from "./aggregate-message-consumer/aggregate-message-consumer.js";
export {
    AggregateQueryService,
    type AggregateQueryServiceOptions
} from "./aggregate-query-service/aggregate-query-service.js";
export { aggregateSnapshotTransformer } from "./aggregate-snapshot-transformer/aggregate-snapshot-transformer.js";
export type { ILogger } from "./logger/i-logger.js";
export { VoidLogger } from "./logger/void-logger.js";
