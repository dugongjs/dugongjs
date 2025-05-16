export { IAggregateQueryService } from "./common/ipc/i-aggregate-query-service.js";
export type { IMessageChannelParticipant } from "./common/message-broker/i-message-channel-participant.js";
export { IInboundMessageMapper } from "./inbound/message-broker/i-inbound-message-mapper.js";
export { IMessageConsumer } from "./inbound/message-broker/i-message-consumer.js";
export { IMessageProducer } from "./outbound/message-broker/i-message-producer.js";
export { IOutboundMessageMapper } from "./outbound/message-broker/i-outbound-message-mapper.js";
export { IConsumedMessageRepository } from "./outbound/repository/i-consumed-message-repository.js";
export { IDomainEventRepository } from "./outbound/repository/i-domain-event-repository.js";
export { ISnapshotRepository, type SerializedSnapshot } from "./outbound/repository/i-snapshot-repository.js";
export {
    ITransactionManager,
    type RunInTransaction,
    type TransactionContext
} from "./outbound/transaction-manager/i-transaction-manager.js";
