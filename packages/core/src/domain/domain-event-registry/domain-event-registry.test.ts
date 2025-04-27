import type { DomainEventClass } from "../abstract-domain-event/domain-event-class.js";
import { domainEventRegistry } from "./domain-event-registry.js";
import { DomainEventAlreadyRegisteredError } from "./errors/domain-event-already-registered.error.js";

describe("DomainEventRegistry", () => {
    let registry: typeof domainEventRegistry;
    let mockEventClass: DomainEventClass;

    beforeEach(() => {
        registry = new (domainEventRegistry.constructor as any)();
        mockEventClass = {
            aggregateType: "testAggregate",
            type: "testType",
            version: 1
        } as DomainEventClass;
    });

    describe("register", () => {
        it("should register a domain event class", () => {
            registry.register(mockEventClass);

            const result = registry.getDomainEventClass(
                mockEventClass.origin,
                mockEventClass.aggregateType,
                mockEventClass.type,
                mockEventClass.version
            );

            expect(result).toBe(mockEventClass);
        });

        it("should throw an error if the event is already registered", () => {
            registry.register(mockEventClass);

            expect(() => registry.register(mockEventClass)).toThrowError(
                new DomainEventAlreadyRegisteredError(
                    mockEventClass.origin,
                    mockEventClass.aggregateType,
                    mockEventClass.type,
                    mockEventClass.version
                )
            );
        });
    });

    describe("getDomainEventClass", () => {
        it("should return the registered domain event class", () => {
            registry.register(mockEventClass);

            const result = registry.getDomainEventClass(
                mockEventClass.origin,
                mockEventClass.aggregateType,
                mockEventClass.type,
                mockEventClass.version
            );

            expect(result).toBe(mockEventClass);
        });

        it("should return null if the event is not registered", () => {
            const result = registry.getDomainEventClass(
                "nonExistentOrigin",
                "nonExistentAggregate",
                "nonExistentType",
                1
            );

            expect(result).toBeNull();
        });
    });

    describe("clear", () => {
        it("should clear all registered events", () => {
            registry.register(mockEventClass);

            registry.clear();

            const result = registry.getDomainEventClass(
                mockEventClass.origin,
                mockEventClass.aggregateType,
                mockEventClass.type,
                mockEventClass.version
            );

            expect(result).toBeNull();
        });
    });

    describe("getAllRegisteredEvents", () => {
        it("should return all registered domain event classes", () => {
            const anotherMockEventClass = {
                origin: "anotherOrigin",
                aggregateType: "anotherAggregate",
                type: "anotherType",
                version: 1
            } as DomainEventClass;

            registry.register(mockEventClass);
            registry.register(anotherMockEventClass);

            const result = registry.getAllRegisteredEvents();

            expect(result).toContain(mockEventClass);
            expect(result).toContain(anotherMockEventClass);
        });

        it("should return an empty array if no events are registered", () => {
            const result = registry.getAllRegisteredEvents();

            expect(result).toEqual([]);
        });
    });
});
