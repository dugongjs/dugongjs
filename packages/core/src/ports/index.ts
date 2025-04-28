export type { IMessageChannelParticipant } from "./common/message-broker/i-message-channel-participant.js";
export { IMessageConsumer } from "./inbound/message-broker/i-message-consumer.js";
export { IMessageExtractor } from "./inbound/message-broker/i-message-extractor.js";
export { IMessageProducer } from "./outbound/message-broker/i-message-producer.js";
export { IConsumedMessageRepository } from "./outbound/repository/i-consumed-message-repository.js";
export { IDomainEventRepository } from "./outbound/repository/i-domain-event-repository.js";
export { ISnapshotRepository, type SerializedSnapshot } from "./outbound/repository/i-snapshot-repository.js";
export {
    ITransactionManager,
    type RunInTransaction,
    type TransactionContext
} from "./outbound/transaction-manager/i-transaction-manager.js";
