import type { SerializedDomainEvent } from "../../../domain/abstract-domain-event/serialized-domain-event.js";
import type { InMemoryMessageBus } from "../../../infrastructure/in-memory-message-bus/in-memory-message-bus.js";
import type { OnMessage } from "../../../ports/inbound/message-broker/i-message-consumer.js";
import type { IMessageConsumer } from "../../../ports/index.js";
import { MessageChannelParticipantInMemory } from "../../common/message-broker/message-channel-participant-in-memory.js";

export class MessageConsumerInMemory
    extends MessageChannelParticipantInMemory
    implements IMessageConsumer<SerializedDomainEvent>
{
    constructor(private readonly messageBus: InMemoryMessageBus<SerializedDomainEvent>) {
        super();
    }

    public generateMessageConsumerIdForAggregate(origin: string, aggregateType: string, consumerName: string): string {
        return `${origin}-${aggregateType}-${consumerName}`;
    }

    public async registerDomainEventMessageConsumer(
        channelId: string,
        _: string,
        onMessage?: OnMessage<SerializedDomainEvent> | undefined
    ): Promise<void> {
        return this.messageBus.subscribe(channelId, onMessage ? onMessage : async () => {});
    }
}
