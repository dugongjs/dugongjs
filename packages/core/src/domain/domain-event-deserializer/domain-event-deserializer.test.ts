import { faker } from "@faker-js/faker";
import { AbstractDomainEvent } from "../abstract-domain-event/abstract-domain-event.js";
import type { SerializedDomainEvent } from "../abstract-domain-event/serialized-domain-event.js";
import { domainEventRegistry } from "../domain-event-registry/domain-event-registry.js";
import { domainEventDeserializer } from "./domain-event-deserializer.js";

vi.mock("../domain-event-registry/domain-event-registry", () => ({
    domainEventRegistry: {
        getDomainEventClass: vi.fn()
    }
}));

class MockDomainEventV2 extends AbstractDomainEvent<{ owner: string; currency: string }> {
    public readonly origin = "TestOrigin";
    public readonly aggregateType = "TestAggregate";
    public readonly type = "TestType";
    public readonly version = 2;
}

class MockDomainEventV1 extends AbstractDomainEvent<{ owner: string }> {
    public readonly origin = "TestOrigin";
    public readonly aggregateType = "TestAggregate";
    public readonly type = "TestType";
    public readonly version = 1;

    public upcast(): MockDomainEventV2 {
        return new MockDomainEventV2(this.getAggregateId(), { ...this.getPayload(), currency: "USD" });
    }
}

describe("DomainEventDeserializer", () => {
    describe("deserializeDomainEvents", () => {
        it("should deserialize valid domain events", () => {
            const mockDomainEventClass = {
                deserialize: vi.fn().mockImplementation((serializedEvent) => ({
                    ...serializedEvent,
                    deserialized: true
                }))
            };

            vi.spyOn(domainEventRegistry, "getDomainEventClass").mockImplementation(
                () => mockDomainEventClass as unknown as typeof AbstractDomainEvent
            );

            const serializedEvents: SerializedDomainEvent[] = [
                {
                    aggregateType: "TestAggregate",
                    type: "TestType",
                    version: 1,
                    payload: { key: "value" },
                    origin: "TestOrigin",
                    id: faker.string.uuid(),
                    aggregateId: faker.string.uuid(),
                    sequenceNumber: 1,
                    timestamp: faker.date.recent()
                }
            ];

            const result = domainEventDeserializer.deserializeDomainEvents(...serializedEvents);

            expect(domainEventRegistry.getDomainEventClass).toHaveBeenCalledWith(
                "TestOrigin",
                "TestAggregate",
                "TestType",
                1
            );
            expect(mockDomainEventClass.deserialize).toHaveBeenCalledWith(serializedEvents[0]);
            expect(result).toHaveLength(1);
        });

        it("should filter out events with no matching domain event class", () => {
            vi.spyOn(domainEventRegistry, "getDomainEventClass").mockImplementation(() => null);

            const serializedEvents: SerializedDomainEvent[] = [
                {
                    aggregateType: "testAggregate",
                    type: "testType",
                    version: 1,
                    payload: { key: "value" },
                    origin: "TestOrigin",
                    id: faker.string.uuid(),
                    aggregateId: faker.string.uuid(),
                    sequenceNumber: 1,
                    timestamp: faker.date.recent()
                }
            ];

            const result = domainEventDeserializer.deserializeDomainEvents(...serializedEvents);

            expect(domainEventRegistry.getDomainEventClass).toHaveBeenCalledWith(
                "TestOrigin",
                "testAggregate",
                "testType",
                1
            );
            expect(result).toHaveLength(0);
        });

        it("should upcast deserialized domain events to their latest version", () => {
            vi.spyOn(domainEventRegistry, "getDomainEventClass").mockImplementation(
                () => MockDomainEventV1 as unknown as typeof AbstractDomainEvent
            );

            const owner = faker.person.fullName();

            const serializedEvents: SerializedDomainEvent[] = [
                {
                    aggregateType: "TestAggregate",
                    type: "TestType",
                    version: 1,
                    payload: { owner },
                    origin: "TestOrigin",
                    id: faker.string.uuid(),
                    aggregateId: faker.string.uuid(),
                    sequenceNumber: 1,
                    timestamp: faker.date.recent()
                }
            ];

            const result = domainEventDeserializer.deserializeDomainEvents(...serializedEvents);

            expect(result).toHaveLength(1);
            expect(result[0]).toBeInstanceOf(MockDomainEventV2);
            expect(result[0].getVersion()).toBe(2);
            expect(result[0].getPayload()).toEqual({ owner, currency: "USD" });
            expect(result[0].getId()).toBe(serializedEvents[0].id);
            expect(result[0].getSequenceNumber()).toBe(1);
        });

        it("should handle an empty array of serialized events", () => {
            const result = domainEventDeserializer.deserializeDomainEvents();

            expect(result).toHaveLength(0);
        });
    });
});
