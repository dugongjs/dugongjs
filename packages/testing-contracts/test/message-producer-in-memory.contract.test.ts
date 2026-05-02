import { InMemoryMessageBus, MessageProducerInMemory, type SerializedDomainEvent } from "@dugongjs/core";
import { randomUUID } from "node:crypto";
import { runMessageProducerContractTests } from "../src/index.js";

function createSerializedDomainEvent(overrides: Partial<SerializedDomainEvent> = {}): SerializedDomainEvent {
    return {
        origin: "ContractTestOrigin",
        aggregateType: "ContractTestAggregate",
        type: "ContractTestEvent",
        version: 1,
        id: randomUUID(),
        aggregateId: randomUUID(),
        payload: { value: randomUUID() },
        sequenceNumber: 1,
        timestamp: new Date(),
        ...overrides
    };
}

runMessageProducerContractTests<SerializedDomainEvent>(async () => {
    const messageBus = new InMemoryMessageBus<SerializedDomainEvent>();
    const producer = new MessageProducerInMemory(messageBus);
    const publishedMessagesByChannel = new Map<string, SerializedDomainEvent[]>();

    return {
        producer,
        cleanup: async () => {
            publishedMessagesByChannel.clear();
        },
        prepareMessageChannel: async (messageChannelId: string) => {
            publishedMessagesByChannel.set(messageChannelId, []);

            messageBus.subscribe(messageChannelId, async (message) => {
                const existingMessages = publishedMessagesByChannel.get(messageChannelId) ?? [];
                existingMessages.push(message);
                publishedMessagesByChannel.set(messageChannelId, existingMessages);
            });
        },
        createMessage: createSerializedDomainEvent,
        getPublishedMessages: async (messageChannelId: string) => {
            return publishedMessagesByChannel.get(messageChannelId) ?? [];
        },
        mapExpectedPublishedMessage: (message) => message
    };
});
