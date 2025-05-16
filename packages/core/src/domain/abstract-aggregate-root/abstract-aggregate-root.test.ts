import { faker } from "@faker-js/faker";
import { AbstractDomainEvent } from "../abstract-domain-event/abstract-domain-event.js";
import { AbstractAggregateRoot, IsInCreationContext, IsInProcessContext } from "./abstract-aggregate-root.js";
import { AggregateIdSetOutsideCreationContextError } from "./errors/aggregate-id-set-outside-creation-context.error.js";
import { MutateEventOutsideCommandContextError } from "./errors/mutate-event-outside-command-context.error.js";

const mockUuid = faker.string.uuid();

vi.mock("uuid", () => ({
    v4: vi.fn(() => mockUuid)
}));

class TestDomainEventWithoutPayload extends AbstractDomainEvent {
    public readonly context = "TestContext";
    public readonly origin = "TestOrigin";
    public readonly aggregateType = "TestAggregate";
    public readonly type = "TestType";
    public readonly version = 1;

    constructor(aggregateId: string) {
        super(aggregateId);
    }
}

class TestDomainEventWithPayload extends AbstractDomainEvent<{ key: string }> {
    public readonly context = "TestContext";
    public readonly origin = "TestOrigin";
    public readonly aggregateType = "TestAggregate";
    public readonly type = "TestType";
    public readonly version = 1;

    constructor(aggregateId: string, payload: { key: string }) {
        super(aggregateId, payload);
    }
}

class TestAggregateRoot extends AbstractAggregateRoot {
    public setCreationContext(isInCreationContext: boolean): void {
        this[IsInCreationContext] = isInCreationContext;
    }

    public setProcessContext(isInProcessContext: boolean): void {
        this[IsInProcessContext] = isInProcessContext;
    }
}

describe("AbstractAggregateRoot", () => {
    describe("getStagedDomainEvents", () => {
        it("should return an empty array when no events are staged", () => {
            const aggregate = new TestAggregateRoot();
            aggregate.setCreationContext(true);
            aggregate.setProcessContext(true);

            expect(aggregate.getStagedDomainEvents()).toEqual([]);
        });

        it("should return staged events in the correct order", () => {
            const aggregate = new TestAggregateRoot();
            aggregate.setCreationContext(true);
            aggregate.setProcessContext(true);

            const event1 = aggregate.createDomainEvent(TestDomainEventWithoutPayload);
            const event2 = aggregate.createDomainEvent(TestDomainEventWithPayload, { key: "value" });

            aggregate.stageDomainEvent(event1, event2);

            expect(aggregate.getStagedDomainEvents()).toEqual([event1, event2]);
        });
    });

    describe("getStagedDomainEventsNotApplied", () => {
        it("should return an empty array when no events are staged", () => {
            const aggregate = new TestAggregateRoot();
            aggregate.setCreationContext(true);
            aggregate.setProcessContext(true);

            expect(aggregate.getStagedDomainEventsNotApplied()).toEqual([]);
        });

        it("should return staged events that have not been applied yet", () => {
            const aggregate = new TestAggregateRoot();
            aggregate.setCreationContext(true);
            aggregate.setProcessContext(true);
            aggregate.setCurrentDomainEventSequenceNumber(5);

            const event1 = aggregate.createDomainEvent(TestDomainEventWithoutPayload);
            const event2 = aggregate.createDomainEvent(TestDomainEventWithPayload, { key: "value" });

            aggregate.stageDomainEvent(event1, event2);

            expect(aggregate.getStagedDomainEventsNotApplied()).toEqual([event1, event2]);
        });

        it("should not return staged events that have been applied", () => {
            const aggregate = new TestAggregateRoot();
            aggregate.setCreationContext(true);
            aggregate.setProcessContext(true);

            const event1 = aggregate.createDomainEvent(TestDomainEventWithoutPayload);
            const event2 = aggregate.createDomainEvent(TestDomainEventWithPayload, { key: "value" });

            aggregate.stageDomainEvent(event1, event2);

            aggregate.setCurrentDomainEventSequenceNumber(2);

            expect(aggregate.getStagedDomainEventsNotApplied()).toEqual([]);
        });
    });

    describe("createDomainEvent", () => {
        it("should set the aggregate ID in creation context", () => {
            const aggregate = new TestAggregateRoot();
            aggregate.setCreationContext(true);
            aggregate.setProcessContext(true);

            aggregate.createDomainEvent(TestDomainEventWithoutPayload);

            expect(aggregate.getId()).toBe(mockUuid);
        });

        it("should create a domain event with the correct aggregate ID and event ID in creation context", () => {
            const aggregate = new TestAggregateRoot();
            aggregate.setCreationContext(true);
            aggregate.setProcessContext(true);

            const event = aggregate.createDomainEvent(TestDomainEventWithoutPayload);

            expect(event).toBeInstanceOf(TestDomainEventWithoutPayload);
            expect(event.getAggregateId()).toBe(mockUuid);
            expect(event.getId()).toBe(mockUuid);
        });

        it("should throw an error if called outside of process context", () => {
            const aggregate = new TestAggregateRoot();
            aggregate.setProcessContext(false);

            expect(() => aggregate.createDomainEvent(TestDomainEventWithoutPayload)).toThrowError(
                MutateEventOutsideCommandContextError
            );
        });

        it("should throw an error if the aggregate ID is not set and called outside of creation context", () => {
            const aggregate = new TestAggregateRoot();
            aggregate.setProcessContext(true);
            aggregate.setCreationContext(false);

            expect(() => aggregate.createDomainEvent(TestDomainEventWithoutPayload)).toThrowError(
                AggregateIdSetOutsideCreationContextError
            );
        });

        it("should create a domain event without payload", () => {
            const aggregate = new TestAggregateRoot();
            aggregate.setCreationContext(true);
            aggregate.setProcessContext(true);

            const event = aggregate.createDomainEvent(TestDomainEventWithoutPayload);

            expect(event).toBeInstanceOf(TestDomainEventWithoutPayload);
            expect(event.getPayload()).toBeNull();
        });

        it("should create a domain event with payload", () => {
            const aggregate = new TestAggregateRoot();
            aggregate.setCreationContext(true);
            aggregate.setProcessContext(true);

            const event = aggregate.createDomainEvent(TestDomainEventWithPayload, { key: "value" });

            expect(event).toBeInstanceOf(TestDomainEventWithPayload);
            expect(event.getPayload()).toEqual({ key: "value" });
        });

        it("should call the onCreate lifecycle method if it exists", () => {
            const onCreateMock = vi.fn();

            class TestDomainEventWithLifecycle extends TestDomainEventWithoutPayload {
                public onCreate(): void {
                    onCreateMock();
                }
            }

            const aggregate = new TestAggregateRoot();
            aggregate.setCreationContext(true);
            aggregate.setProcessContext(true);

            aggregate.createDomainEvent(TestDomainEventWithLifecycle);

            expect(onCreateMock).toHaveBeenCalled();
        });

        it("should have the correct type for the event", () => {
            const aggregate = new TestAggregateRoot();
            aggregate.setCreationContext(true);
            aggregate.setProcessContext(true);

            const event = aggregate.createDomainEvent(TestDomainEventWithoutPayload);

            expectTypeOf(event).toEqualTypeOf<TestDomainEventWithoutPayload>();
        });
    });

    describe("stageDomainEvent", () => {
        it("should stage domain events with correct sequence numbers when starting from 0 events", () => {
            const aggregate = new TestAggregateRoot();
            aggregate.setCreationContext(true);
            aggregate.setProcessContext(true);

            const event1 = aggregate.createDomainEvent(TestDomainEventWithoutPayload);
            const event2 = aggregate.createDomainEvent(TestDomainEventWithPayload, { key: "value" });

            aggregate.stageDomainEvent(event1, event2);

            expect(aggregate["stagedEvents"].get(1)).toBe(event1);
            expect(aggregate["stagedEvents"].get(2)).toBe(event2);
        });

        it("should stage domain events with correct sequence numbers when starting from existing events", () => {
            const aggregate = new TestAggregateRoot();
            aggregate.setCreationContext(true);
            aggregate.setProcessContext(true);
            aggregate.setCurrentDomainEventSequenceNumber(5);

            const event1 = aggregate.createDomainEvent(TestDomainEventWithoutPayload);
            const event2 = aggregate.createDomainEvent(TestDomainEventWithPayload, { key: "value" });

            aggregate.stageDomainEvent(event1, event2);

            expect(aggregate["stagedEvents"].get(6)).toBe(event1);
            expect(aggregate["stagedEvents"].get(7)).toBe(event2);
        });

        it("should set the correct sequence number for staged events", () => {
            const aggregate = new TestAggregateRoot();
            aggregate.setCreationContext(true);
            aggregate.setProcessContext(true);

            const event1 = aggregate.createDomainEvent(TestDomainEventWithoutPayload);
            const event2 = aggregate.createDomainEvent(TestDomainEventWithPayload, { key: "value" });

            aggregate.stageDomainEvent(event1, event2);

            expect(event1.getSequenceNumber()).toBe(1);
            expect(event2.getSequenceNumber()).toBe(2);
        });

        it("should throw an error if called outside of process context", () => {
            const aggregate = new TestAggregateRoot();
            aggregate.setProcessContext(false);

            expect(() => aggregate.stageDomainEvent(new TestDomainEventWithoutPayload(mockUuid))).toThrowError(
                MutateEventOutsideCommandContextError
            );
        });

        it("should call the onStage lifecycle method if it exists", () => {
            const onStageMock = vi.fn();

            class TestDomainEventWithLifecycle extends TestDomainEventWithoutPayload {
                public onStage(): void {
                    onStageMock();
                }
            }

            const aggregate = new TestAggregateRoot();
            aggregate.setCreationContext(true);
            aggregate.setProcessContext(true);

            const event = aggregate.createDomainEvent(TestDomainEventWithLifecycle);
            aggregate.stageDomainEvent(event);

            expect(onStageMock).toHaveBeenCalled();
        });
    });
});
