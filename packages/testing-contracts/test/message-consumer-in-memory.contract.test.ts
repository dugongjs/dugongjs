import {
    InMemoryMessageBus,
    MessageConsumerInMemory,
    MessageProducerInMemory,
    type SerializedDomainEvent
} from "@dugongjs/core";
import { randomUUID } from "node:crypto";
import { runMessageConsumerContractTests } from "../src/index.js";

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

runMessageConsumerContractTests<SerializedDomainEvent>(async () => {
    const messageBus = new InMemoryMessageBus<SerializedDomainEvent>();
    const consumer = new MessageConsumerInMemory(messageBus);
    const producer = new MessageProducerInMemory(messageBus);

    return {
        consumer,
        cleanup: async () => {
            return;
        },
        createMessage: createSerializedDomainEvent,
        publishMessage: async (messageChannelId, message) => {
            await producer.publishMessage(null, messageChannelId, message);
        }
    };
});
