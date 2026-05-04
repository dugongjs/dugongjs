import {
    AbstractAggregateRoot,
    AbstractDomainEvent,
    Aggregate,
    Apply,
    CreationProcess,
    DomainEvent,
    Process
} from "@dugongjs/core";
import { describe, expect, it } from "vitest";
import { assertNoStagedEvents } from "./assert-no-staged-events.js";
import { assertSingleStagedEvent } from "./assert-single-staged-event.js";
import { assertStagedEventCount } from "./assert-staged-event-count.js";
import { assertStagedEvent } from "./assert-staged-event.js";
import { MultipleStagedEventsFoundAssertionError } from "./errors/multiple-staged-events-found-assertion.error.js";
import { StagedEventCountMismatchAssertionError } from "./errors/staged-event-count-mismatch-assertion.error.js";
import { StagedEventNotFoundAssertionError } from "./errors/staged-event-not-found-assertion.error.js";
import { StagedEventsExistAssertionError } from "./errors/staged-events-exist-assertion.error.js";
import { findStagedEvents } from "./find-staged-events.js";

// Domain Events

abstract class AbstractTestDomainEvent extends AbstractDomainEvent<null> {
    public readonly origin = "test";
    public readonly aggregateType = "TestAggregate";
    public readonly version = 1;
}

@DomainEvent()
class TestEventA extends AbstractTestDomainEvent {
    public readonly type = "TestEventA";

    constructor(aggregateId: string) {
        super(aggregateId);
    }
}

@DomainEvent()
class TestEventB extends AbstractTestDomainEvent {
    public readonly type = "TestEventB";

    constructor(aggregateId: string) {
        super(aggregateId);
    }
}

// Aggregate

@Aggregate("TestAggregate")
class TestAggregate extends AbstractAggregateRoot {
    @CreationProcess()
    public createWithEventA(): void {
        const event = this.createDomainEvent(TestEventA);
        this.stageDomainEvent(event);
    }

    @Process()
    public addEventA(): void {
        const event = this.createDomainEvent(TestEventA);
        this.stageDomainEvent(event);
    }

    @Process()
    public addEventB(): void {
        const event = this.createDomainEvent(TestEventB);
        this.stageDomainEvent(event);
    }

    @Apply(TestEventA)
    public applyTestEventA(): void {
        // Event applied
    }

    @Apply(TestEventB)
    public applyTestEventB(): void {
        // Event applied
    }
}

describe("aggregate event assertions", () => {
    describe("findStagedEvents", () => {
        it("should return matching staged events by type", () => {
            const aggregate = new TestAggregate();
            aggregate.createWithEventA();
            aggregate.addEventB();
            aggregate.addEventA();

            const result = findStagedEvents(aggregate, TestEventA);

            expect(result).toHaveLength(2);
            expect(result.every((event) => event instanceof TestEventA)).toBe(true);
        });
    });

    describe("assertStagedEvent", () => {
        it("should return the first matching staged event", () => {
            const aggregate = new TestAggregate();
            aggregate.createWithEventA();
            aggregate.addEventA();

            const result = assertStagedEvent(aggregate, TestEventA);

            expect(result).toBeInstanceOf(TestEventA);
        });

        it("should throw StagedEventNotFoundAssertionError when no matching event exists", () => {
            expect.assertions(4);
            const aggregate = new TestAggregate();
            aggregate.createWithEventA();
            aggregate.addEventA();

            expect(() => assertStagedEvent(aggregate, TestEventB)).toThrowError(StagedEventNotFoundAssertionError);

            try {
                assertStagedEvent(aggregate, TestEventB);
            } catch (error) {
                expect((error as Error).message).toContain("Dugong assertion failed [staged-event-not-found]");
                expect((error as Error).message).toContain("TestAggregate");
                expect((error as Error).message).toContain("TestEventB");
            }
        });
    });

    describe("assertSingleStagedEvent", () => {
        it("should return the matching event when exactly one exists", () => {
            const aggregate = new TestAggregate();
            aggregate.createWithEventA();
            aggregate.addEventB();

            const result = assertSingleStagedEvent(aggregate, TestEventA);

            expect(result).toBeInstanceOf(TestEventA);
        });

        it("should throw StagedEventNotFoundAssertionError when no matching event exists", () => {
            const aggregate = new TestAggregate();
            aggregate.createWithEventA();

            expect(() => assertSingleStagedEvent(aggregate, TestEventB)).toThrowError(
                StagedEventNotFoundAssertionError
            );
        });

        it("should throw MultipleStagedEventsFoundAssertionError when more than one matching event exists", () => {
            expect.assertions(3);
            const aggregate = new TestAggregate();
            aggregate.createWithEventA();
            aggregate.addEventA();

            expect(() => assertSingleStagedEvent(aggregate, TestEventA)).toThrowError(
                MultipleStagedEventsFoundAssertionError
            );

            try {
                assertSingleStagedEvent(aggregate, TestEventA);
            } catch (error) {
                expect((error as Error).message).toContain("Dugong assertion failed [multiple-staged-events-found]");
                expect((error as Error).message).toContain("found 2");
            }
        });
    });

    describe("assertNoStagedEvents", () => {
        it("should pass when aggregate has no staged events", () => {
            const aggregate = new TestAggregate();

            expect(() => assertNoStagedEvents(aggregate)).not.toThrow();
        });

        it("should throw StagedEventsExistAssertionError when staged events exist", () => {
            const aggregate = new TestAggregate();
            aggregate.createWithEventA();

            expect(() => assertNoStagedEvents(aggregate)).toThrowError(StagedEventsExistAssertionError);
        });
    });

    describe("assertStagedEventCount", () => {
        it("should pass when staged event count matches expected count", () => {
            const aggregate = new TestAggregate();
            aggregate.createWithEventA();
            aggregate.addEventB();

            expect(() => assertStagedEventCount(aggregate, 2)).not.toThrow();
        });

        it("should throw StagedEventCountMismatchAssertionError when count does not match", () => {
            expect.assertions(3);
            const aggregate = new TestAggregate();
            aggregate.createWithEventA();
            aggregate.addEventB();

            expect(() => assertStagedEventCount(aggregate, 1)).toThrowError(StagedEventCountMismatchAssertionError);

            try {
                assertStagedEventCount(aggregate, 1);
            } catch (error) {
                expect((error as Error).message).toContain("Dugong assertion failed [staged-event-count-mismatch]");
                expect((error as Error).message).toContain("have 1 staged event(s), but found 2");
            }
        });
    });
});
