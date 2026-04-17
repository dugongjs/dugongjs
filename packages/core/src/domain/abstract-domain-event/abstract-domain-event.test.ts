import { faker } from "@faker-js/faker";
import { z } from "zod";
import type { AbstractDomainEventStatics } from "./abstract-domain-event-statics.js";
import { AbstractDomainEvent } from "./abstract-domain-event.js";
import { SchemaValidationError } from "./errors/schema-validation.error.js";
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
            event.setTenantId(faker.string.uuid());
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
                tenantId: event.getTenantId(),
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
                tenantId: faker.string.uuid(),
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
            expect(event.getTenantId()).toBe(serializedDomainEvent.tenantId);
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
                tenantId: faker.string.uuid(),
                correlationId: faker.string.uuid(),
                triggeredByEventId: faker.string.uuid(),
                triggeredByUserId: faker.string.uuid(),
                metadata: { metaKey: faker.string.uuid() }
            };

            const event = TestDomainEvent.deserialize(serializedDomainEvent);

            expectTypeOf(event).toEqualTypeOf<TestDomainEvent>();
        });
    });

    describe("fromSchema", () => {
        it("should create an event class from a schema", async () => {
            // Implement StandardSchema with zod for testing
            const dateToIsoDatetime = z.codec(z.date(), z.iso.datetime(), {
                encode: (isoString) => new Date(isoString),
                decode: (date) => date.toISOString()
            });

            const userSchema = z.object({
                name: z.string(),
                age: z.number(),
                email: z.email(),
                dateOfBirth: dateToIsoDatetime
            });

            class UserCreatedEvent extends AbstractDomainEvent.fromSchema(userSchema) {
                public origin = "UserContext-UserService";
                public aggregateType = "User";
                public type = "UserCreated";
                public version = 1;
            }

            const name = faker.person.fullName();
            const age = faker.number.int({ min: 18, max: 100 });
            const email = faker.internet.email();
            const dateOfBirth = faker.date.past();

            const event = new UserCreatedEvent(faker.string.uuid(), {
                name,
                age,
                email,
                dateOfBirth
            });

            await event.validatePayload();

            expect(event.getPayload()).toEqual(
                expect.objectContaining({
                    name,
                    age,
                    email,
                    dateOfBirth: dateOfBirth.toISOString()
                })
            );
        });

        it("should throw SchemaValidationError when validation fails", async () => {
            const userSchema = z.object({
                name: z.string(),
                email: z.email()
            });

            class UserCreatedEvent extends AbstractDomainEvent.fromSchema(userSchema) {
                public origin = "UserContext";
                public aggregateType = "User";
                public type = "UserCreated";
                public version = 1;
            }

            const event = new UserCreatedEvent(faker.string.uuid(), {
                name: faker.person.fullName(),
                email: "not-a-valid-email"
            });

            await expect(event.validatePayload()).rejects.toThrow(SchemaValidationError);
        });

        it("should include all validation issues in SchemaValidationError", async () => {
            const userSchema = z.object({
                name: z.string().min(2),
                age: z.number().min(0),
                email: z.email()
            });

            class UserCreatedEvent extends AbstractDomainEvent.fromSchema(userSchema) {
                public origin = "UserContext";
                public aggregateType = "User";
                public type = "UserCreated";
                public version = 1;
            }

            const event = new UserCreatedEvent(faker.string.uuid(), {
                name: "A", // too short
                age: -5, // negative
                email: "invalid" // not an email
            });

            try {
                await event.validatePayload();
                expect.fail("Expected SchemaValidationError");
            } catch (error) {
                expect(error).toBeInstanceOf(SchemaValidationError);
                expect((error as SchemaValidationError).issues.length).toBeGreaterThanOrEqual(3);
            }
        });

        it("should work with simple schema without transformation", async () => {
            const simpleSchema = z.object({
                id: z.string(),
                count: z.number()
            });

            class SimpleEvent extends AbstractDomainEvent.fromSchema(simpleSchema) {
                public origin = "TestOrigin";
                public aggregateType = "TestAggregate";
                public type = "SimpleEvent";
                public version = 1;
            }

            const payload = { id: faker.string.uuid(), count: 42 };
            const event = new SimpleEvent(faker.string.uuid(), payload);

            await event.validatePayload();

            expect(event.getPayload()).toEqual(payload);
        });

        it("should handle optional fields in schema", async () => {
            const schemaWithOptional = z.object({
                required: z.string(),
                optional: z.string().optional()
            });

            class EventWithOptional extends AbstractDomainEvent.fromSchema(schemaWithOptional) {
                public origin = "TestOrigin";
                public aggregateType = "TestAggregate";
                public type = "EventWithOptional";
                public version = 1;
            }

            const event = new EventWithOptional(faker.string.uuid(), {
                required: "value"
                // optional is omitted
            });

            await event.validatePayload();

            expect(event.getPayload()).toEqual({ required: "value" });
        });

        it("should handle nested objects in schema", async () => {
            const nestedSchema = z.object({
                user: z.object({
                    name: z.string(),
                    address: z.object({
                        city: z.string(),
                        zip: z.string()
                    })
                })
            });

            class NestedEvent extends AbstractDomainEvent.fromSchema(nestedSchema) {
                public origin = "TestOrigin";
                public aggregateType = "TestAggregate";
                public type = "NestedEvent";
                public version = 1;
            }

            const payload = {
                user: {
                    name: faker.person.fullName(),
                    address: {
                        city: faker.location.city(),
                        zip: faker.location.zipCode()
                    }
                }
            };

            const event = new NestedEvent(faker.string.uuid(), payload);
            await event.validatePayload();

            expect(event.getPayload()).toEqual(payload);
        });

        it("should handle arrays in schema", async () => {
            const arraySchema = z.object({
                tags: z.array(z.string()),
                scores: z.array(z.number())
            });

            class ArrayEvent extends AbstractDomainEvent.fromSchema(arraySchema) {
                public origin = "TestOrigin";
                public aggregateType = "TestAggregate";
                public type = "ArrayEvent";
                public version = 1;
            }

            const payload = {
                tags: ["a", "b", "c"],
                scores: [1, 2, 3]
            };

            const event = new ArrayEvent(faker.string.uuid(), payload);
            await event.validatePayload();

            expect(event.getPayload()).toEqual(payload);
        });

        it("should provide static getters on schema-based event class", () => {
            const schema = z.object({ value: z.string() });

            class StaticGetterEvent extends AbstractDomainEvent.fromSchema(schema) {
                public origin = "StaticOrigin";
                public aggregateType = "StaticAggregate";
                public type = "StaticType";
                public version = 42;
            }

            expect(StaticGetterEvent.origin).toBe("StaticOrigin");
            expect(StaticGetterEvent.aggregateType).toBe("StaticAggregate");
            expect(StaticGetterEvent.type).toBe("StaticType");
            expect(StaticGetterEvent.version).toBe(42);
        });

        it("should support deserialize on schema-based event class", async () => {
            const schema = z.object({ value: z.string() });

            class DeserializableEvent extends AbstractDomainEvent.fromSchema(schema) {
                public origin = "TestOrigin";
                public aggregateType = "TestAggregate";
                public type = "DeserializableEvent";
                public version = 1;
            }

            const serialized: SerializedDomainEvent = {
                origin: "TestOrigin",
                aggregateType: "TestAggregate",
                type: "DeserializableEvent",
                version: 1,
                id: faker.string.uuid(),
                aggregateId: faker.string.uuid(),
                payload: { value: "test" },
                sequenceNumber: 1,
                timestamp: new Date(),
                tenantId: undefined,
                correlationId: undefined,
                triggeredByEventId: undefined,
                triggeredByUserId: undefined,
                metadata: undefined
            };

            const event = DeserializableEvent.deserialize(serialized);

            expect(event).toBeInstanceOf(DeserializableEvent);
            expect(event.getPayload()).toEqual({ value: "test" });
        });

        it("should support serialize/deserialize roundtrip", async () => {
            const schema = z.object({
                name: z.string(),
                count: z.number()
            });

            class RoundtripEvent extends AbstractDomainEvent.fromSchema(schema) {
                public origin = "TestOrigin";
                public aggregateType = "TestAggregate";
                public type = "RoundtripEvent";
                public version = 1;
            }

            const aggregateId = faker.string.uuid();
            const payload = { name: "test", count: 123 };

            const original = new RoundtripEvent(aggregateId, payload);
            original.setId(faker.string.uuid());
            original.setSequenceNumber(1);
            original.setTimestamp(new Date());

            await original.onCreate?.();

            const serialized = original.serialize();
            const restored = RoundtripEvent.deserialize(serialized);

            expect(restored.getAggregateId()).toBe(original.getAggregateId());
            expect(restored.getPayload()).toEqual(original.getPayload());
            expect(restored.getId()).toBe(original.getId());
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

        it("should enforce type safety when using fromSchema", () => {
            const dateToIsoDatetime = z.codec(z.date(), z.iso.datetime(), {
                encode: (isoString) => new Date(isoString),
                decode: (date) => date.toISOString()
            });

            const userSchema = z.object({
                name: z.string(),
                age: z.number(),
                email: z.email(),
                dateOfBirth: dateToIsoDatetime
            });

            class UserCreatedEvent extends AbstractDomainEvent.fromSchema(userSchema) {
                public origin = "UserContext-UserService";
                public aggregateType = "User";
                public type = "UserCreated";
                public version = 1;
            }

            const event = new UserCreatedEvent(faker.string.uuid(), {
                name: faker.person.fullName(),
                age: faker.number.int({ min: 18, max: 100 }),
                email: faker.internet.email(),
                dateOfBirth: faker.date.past() // dateOfBirth should be accepted as a Date in the constructor
            });

            const payload = event.getPayload();

            expectTypeOf(payload).toEqualTypeOf<{
                name: string;
                age: number;
                email: string;
                dateOfBirth: string; // The payload should have dateOfBirth as a string since it gets encoded to ISO string
            }>();

            // The event class should also have the static properties from AbstractDomainEventStatics
            expectTypeOf<typeof UserCreatedEvent>().toExtend<AbstractDomainEventStatics>();
        });

        it("should reject incorrect payload type in constructor", () => {
            const schema = z.object({
                name: z.string(),
                age: z.number()
            });

            class TypedEvent extends AbstractDomainEvent.fromSchema(schema) {
                public origin = "TestOrigin";
                public aggregateType = "TestAggregate";
                public type = "TypedEvent";
                public version = 1;
            }

            // @ts-expect-error: age should be number, not string
            new TypedEvent(faker.string.uuid(), { name: "test", age: "not a number" });
        });

        it("should reject missing required fields in payload", () => {
            const schema = z.object({
                required1: z.string(),
                required2: z.number()
            });

            class RequiredFieldsEvent extends AbstractDomainEvent.fromSchema(schema) {
                public origin = "TestOrigin";
                public aggregateType = "TestAggregate";
                public type = "RequiredFieldsEvent";
                public version = 1;
            }

            // @ts-expect-error: required2 is missing
            new RequiredFieldsEvent(faker.string.uuid(), { required1: "test" });
        });

        it("should correctly type optional fields", () => {
            const schema = z.object({
                required: z.string(),
                optional: z.string().optional()
            });

            class OptionalFieldEvent extends AbstractDomainEvent.fromSchema(schema) {
                public origin = "TestOrigin";
                public aggregateType = "TestAggregate";
                public type = "OptionalFieldEvent";
                public version = 1;
            }

            // Should compile without optional field
            const event1 = new OptionalFieldEvent(faker.string.uuid(), { required: "test" });

            // Should compile with optional field
            const event2 = new OptionalFieldEvent(faker.string.uuid(), {
                required: "test",
                optional: "also provided"
            });

            expectTypeOf(event1.getPayload().optional).toEqualTypeOf<string | undefined>();
            expectTypeOf(event2.getPayload().optional).toEqualTypeOf<string | undefined>();
        });

        it("should type deserialize return value as the concrete class", () => {
            const schema = z.object({ value: z.string() });

            class ConcreteEvent extends AbstractDomainEvent.fromSchema(schema) {
                public origin = "TestOrigin";
                public aggregateType = "TestAggregate";
                public type = "ConcreteEvent";
                public version = 1;
            }

            const serialized: SerializedDomainEvent = {
                origin: "TestOrigin",
                aggregateType: "TestAggregate",
                type: "ConcreteEvent",
                version: 1,
                id: faker.string.uuid(),
                aggregateId: faker.string.uuid(),
                payload: { value: "test" },
                sequenceNumber: 1,
                timestamp: new Date(),
                tenantId: undefined,
                correlationId: undefined,
                triggeredByEventId: undefined,
                triggeredByUserId: undefined,
                metadata: undefined
            };

            const event = ConcreteEvent.deserialize(serialized);

            expectTypeOf(event).toEqualTypeOf<ConcreteEvent>();
        });

        it("should correctly infer constructor parameter types", () => {
            const schema = z.object({
                name: z.string(),
                active: z.boolean()
            });

            class InferredEvent extends AbstractDomainEvent.fromSchema(schema) {
                public origin = "TestOrigin";
                public aggregateType = "TestAggregate";
                public type = "InferredEvent";
                public version = 1;
            }

            // Verify constructor parameters are correctly typed
            type ConstructorParams = ConstructorParameters<typeof InferredEvent>;
            expectTypeOf<ConstructorParams>().toEqualTypeOf<
                [aggregateId: string, payload: { name: string; active: boolean }]
            >();
        });

        it("should differentiate input and output types with codec", () => {
            const numberToString = z.codec(z.number(), z.string(), {
                encode: (str) => parseInt(str, 10),
                decode: (num) => num.toString()
            });

            const schema = z.object({
                value: numberToString
            });

            class CodecEvent extends AbstractDomainEvent.fromSchema(schema) {
                public origin = "TestOrigin";
                public aggregateType = "TestAggregate";
                public type = "CodecEvent";
                public version = 1;
            }

            // Constructor accepts number (input type)
            const event = new CodecEvent(faker.string.uuid(), { value: 42 });

            // getPayload returns string (output type)
            expectTypeOf(event.getPayload()).toEqualTypeOf<{ value: string }>();
        });
    });
});
