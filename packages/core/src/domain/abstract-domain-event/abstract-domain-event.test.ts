import { faker } from "@faker-js/faker";
import { AbstractDomainEvent } from "./abstract-domain-event.js";
import type { SerializedDomainEvent } from "./serialized-domain-event.js";

class TestDomainEvent extends AbstractDomainEvent<{ key: string }> {
    public readonly origin = "TestOrigin";
    public readonly aggregateType = "TestAggregate";
    public readonly type = "TestType";
    public readonly version = 1;
}

describe("AbstractDomainEvent", () => {
    describe("constructor", () => {
        it("should initialize with valid constant properties", () => {
            const aggregateId = faker.string.uuid();
            const payload = { key: faker.string.uuid() };
            const event = new TestDomainEvent(aggregateId, payload);

            expect(event.getOrigin()).toBe("TestOrigin");
            expect(event.getAggregateType()).toBe("TestAggregate");
            expect(event.getType()).toBe("TestType");
            expect(event.getVersion()).toBe(1);
            expect(event.getAggregateId()).toBe(aggregateId);
            expect(event.getPayload()).toEqual(payload);
        });

        it("should set payload to null if not provided", () => {
            class NullPayloadEvent extends AbstractDomainEvent<null> {
                public readonly origin = "TestOrigin";
                public readonly aggregateType = "TestAggregate";
                public readonly type = "TestType";
                public readonly version = 1;
            }

            const aggregateId = faker.string.uuid();
            const event = new NullPayloadEvent(aggregateId);
            expect(event.getPayload()).toBeNull();
        });
    });

    describe("serialize", () => {
        it("should serialize the event correctly", () => {
            const aggregateId = faker.string.uuid();
            const payload = { key: faker.string.uuid() };
            const event = new TestDomainEvent(aggregateId, payload);
            event.setId(faker.string.uuid());
            event.setSequenceNumber(faker.number.int({ min: 1, max: 100 }));
            event.setTimestamp(faker.date.past());
            event.setCorrelationId(faker.string.uuid());
            event.setTriggeredByEventId(faker.string.uuid());
            event.setTriggeredByUserId(faker.string.uuid());
            event.setMetadata({ metaKey: faker.string.uuid() });

            const serialized = event.serialize();

            expect(serialized).toEqual({
                origin: "TestOrigin",
                aggregateType: "TestAggregate",
                type: "TestType",
                version: 1,
                id: event.getId(),
                aggregateId: aggregateId,
                payload: payload,
                sequenceNumber: event.getSequenceNumber(),
                timestamp: event.getTimestamp(),
                correlationId: event.getCorrelationId(),
                triggeredByEventId: event.getTriggeredByEventId(),
                triggeredByUserId: event.getTriggeredByUserId(),
                metadata: event.getMetadata()
            });
        });
    });

    describe("deserialize", () => {
        it("should deserialize the event correctly", () => {
            const serializedDomainEvent: SerializedDomainEvent = {
                origin: "TestOrigin",
                aggregateType: "TestAggregate",
                type: "TestType",
                version: 1,
                id: faker.string.uuid(),
                aggregateId: faker.string.uuid(),
                payload: { key: faker.string.uuid() },
                sequenceNumber: faker.number.int({ min: 1, max: 100 }),
                timestamp: faker.date.past(),
                correlationId: faker.string.uuid(),
                triggeredByEventId: faker.string.uuid(),
                triggeredByUserId: faker.string.uuid(),
                metadata: { metaKey: faker.string.uuid() }
            };

            const event = TestDomainEvent.deserialize(serializedDomainEvent);

            expect(event).toBeInstanceOf(TestDomainEvent);
            expect(event.getId()).toBe(serializedDomainEvent.id);
            expect(event.getAggregateId()).toBe(serializedDomainEvent.aggregateId);
            expect(event.getPayload()).toEqual(serializedDomainEvent.payload);
            expect(event.getSequenceNumber()).toBe(serializedDomainEvent.sequenceNumber);
            expect(event.getTimestamp()).toBe(serializedDomainEvent.timestamp);
            expect(event.getCorrelationId()).toBe(serializedDomainEvent.correlationId);
            expect(event.getTriggeredByEventId()).toBe(serializedDomainEvent.triggeredByEventId);
            expect(event.getTriggeredByUserId()).toBe(serializedDomainEvent.triggeredByUserId);
            expect(event.getMetadata()).toEqual(serializedDomainEvent.metadata);
        });

        it("should deserialize the event into the correct type", () => {
            const serializedDomainEvent: SerializedDomainEvent = {
                origin: "TestOrigin",
                aggregateType: "TestAggregate",
                type: "TestType",
                version: 1,
                id: faker.string.uuid(),
                aggregateId: faker.string.uuid(),
                payload: { key: faker.string.uuid() },
                sequenceNumber: faker.number.int({ min: 1, max: 100 }),
                timestamp: faker.date.past(),
                correlationId: faker.string.uuid(),
                triggeredByEventId: faker.string.uuid(),
                triggeredByUserId: faker.string.uuid(),
                metadata: { metaKey: faker.string.uuid() }
            };

            const event = TestDomainEvent.deserialize(serializedDomainEvent);

            expectTypeOf(event).toEqualTypeOf<TestDomainEvent>();
        });
    });

    describe("type-safety", () => {
        it("should enforce type safety for payload", () => {
            const aggregateId = faker.string.uuid();
            const payload = { key: faker.string.uuid() };
            const event = new TestDomainEvent(aggregateId, payload);

            const eventPayload = event.getPayload();

            expectTypeOf(eventPayload).toEqualTypeOf<{ key: string }>();
        });

        it("should only allow serializable objects as payload", () => {
            type NonSerializablePayload = {
                key: string;
                nonSerializable: () => void;
            };

            //@ts-expect-error: NonSerializablePayload is not serializable
            class InvalidPayloadEvent extends AbstractDomainEvent<NonSerializablePayload> {
                public readonly origin = "TestOrigin";
                public readonly aggregateType = "TestAggregate";
                public readonly type = "TestType";
                public readonly version = 1;

                constructor(aggregateId: string, payload: NonSerializablePayload) {
                    super(aggregateId, payload);
                }
            }
        });
    });
});
