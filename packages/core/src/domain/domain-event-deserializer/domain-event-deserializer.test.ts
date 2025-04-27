import { faker } from "@faker-js/faker";
import type { AbstractDomainEvent } from "../abstract-domain-event/abstract-domain-event.js";
import type { ISerializedDomainEvent } from "../abstract-domain-event/i-serialized-domain-event.js";
import { domainEventRegistry } from "../domain-event-registry/domain-event-registry.js";
import { domainEventDeserializer } from "./domain-event-deserializer.js";

vi.mock("../domain-event-registry/domain-event-registry", () => ({
    domainEventRegistry: {
        getDomainEventClass: vi.fn()
    }
}));

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

            const serializedEvents: ISerializedDomainEvent[] = [
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

            const serializedEvents: ISerializedDomainEvent[] = [
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

        it("should handle an empty array of serialized events", () => {
            const result = domainEventDeserializer.deserializeDomainEvents();

            expect(result).toHaveLength(0);
        });
    });
});
