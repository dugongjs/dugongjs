import type { SerializedDomainEvent } from "../../../domain/index.js";
import type { InMemoryMessageBus } from "../../../infrastructure/in-memory-message-bus/in-memory-message-bus.js";
import type { TransactionContext } from "../../../ports/index.js";
import type { IMessageProducer } from "../../../ports/outbound/message-broker/i-message-producer.js";
import { MessageChannelParticipantInMemory } from "../../common/message-broker/message-channel-participant-in-memory.js";

export class MessageProducerInMemory
    extends MessageChannelParticipantInMemory
    implements IMessageProducer<SerializedDomainEvent>
{
    constructor(private readonly messageBus: InMemoryMessageBus<SerializedDomainEvent>) {
        super();
    }

    public publishMessage(
        transactionContext: TransactionContext | null,
        messageChannelId: string,
        message: SerializedDomainEvent
    ): Promise<void> {
        return this.messageBus.publish(messageChannelId, [message], transactionContext ?? undefined);
    }

    public publishMessages(
        transactionContext: TransactionContext | null,
        messageChannelId: string,
        messages: SerializedDomainEvent[]
    ): Promise<void> {
        return this.messageBus.publish(messageChannelId, messages, transactionContext ?? undefined);
    }
}
