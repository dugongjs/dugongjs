import { faker } from "@faker-js/faker";
import {
    AbstractAggregateRoot,
    IsInCreationContext,
    IsInProcessContext
} from "../abstract-aggregate-root/abstract-aggregate-root.js";
import { AbstractDomainEvent, type DomainEventPayload } from "../abstract-domain-event/abstract-domain-event.js";
import { AbstractEventSourcedAggregateRoot } from "../abstract-event-sourced-aggregate-root/abstract-event-sourced-aggregate-root.js";
import { Apply } from "../aggregate-decorators/apply.js";
import { aggregateDomainEventApplier } from "./aggregate-domain-event-applier.js";
import { DomainEventSequenceNumberMismatchError } from "./errors/domain-event-sequence-number-mismatch.error.js";

class MockDomainEvent<TPayload extends DomainEventPayload = null> extends AbstractDomainEvent<TPayload> {
    public readonly context = "MockContext";
    public readonly origin = "MockOrigin";
    public readonly aggregateType = "MockAggregateType";
    public readonly type = "MockDomainEvent";
    public readonly version = 1;
}

class MockAppliedDomainEvent extends AbstractDomainEvent {
    public readonly origin = "MockOrigin";
    public readonly aggregateType = "MockAggregateType";
    public readonly type = "MockAppliedDomainEvent";
    public readonly version = 1;

    public onApply = vi.fn();
}

class MockUnappliedDomainEvent extends AbstractDomainEvent {
    public readonly origin = "MockOrigin";
    public readonly aggregateType = "MockAggregateType";
    public readonly type = "MockUnappliedDomainEvent";
    public readonly version = 1;

    public onApply = vi.fn();
}

class MockEventSourcedAggregateRoot extends AbstractEventSourcedAggregateRoot {
    @Apply(MockDomainEvent)
    public applyMockDomainEvent(domainEvent: MockDomainEvent): void {
        expect(domainEvent).toBeInstanceOf(MockDomainEvent);
    }

    @Apply(MockAppliedDomainEvent)
    public applyMockAppliedDomainEvent(): void {}
}

class MockAggregateRoot extends AbstractAggregateRoot {
    @Apply(MockDomainEvent)
    public applyMockDomainEvent(domainEvent: MockDomainEvent): void {
        expect(domainEvent).toBeInstanceOf(MockDomainEvent);
    }
}

describe("AggregateDomainEventApplier", () => {
    describe("applyDomainEventToAggregate", () => {
        it("should apply domain event to aggregate when sequence numbers match", () => {
            const aggregate = new MockEventSourcedAggregateRoot();
            const domainEvent = new MockDomainEvent(faker.string.uuid()).setSequenceNumber(1);

            aggregateDomainEventApplier.applyDomainEventToAggregate(aggregate, domainEvent);

            expect(aggregate.getCurrentDomainEventSequenceNumber()).toBe(1);
            expect.assertions(2);
        });

        it("should throw an error when sequence numbers do not match", () => {
            const aggregate = new MockEventSourcedAggregateRoot();
            const domainEvent = new MockDomainEvent(faker.string.uuid()).setSequenceNumber(2);

            expect(() => {
                aggregateDomainEventApplier.applyDomainEventToAggregate(aggregate, domainEvent);
            }).toThrowError(DomainEventSequenceNumberMismatchError);
            expect.assertions(1);
        });

        it("should call the onApply lifecycle hook on the domain event", () => {
            const aggregate = new MockEventSourcedAggregateRoot();
            const domainEvent = new MockAppliedDomainEvent(faker.string.uuid()).setSequenceNumber(1);

            aggregateDomainEventApplier.applyDomainEventToAggregate(aggregate, domainEvent);

            expect(domainEvent.onApply).toHaveBeenCalledOnce();
        });

        it("should call the onApply lifecycle hook when no applier is registered for the domain event", () => {
            const aggregate = new MockEventSourcedAggregateRoot();
            const domainEvent = new MockUnappliedDomainEvent(faker.string.uuid()).setSequenceNumber(1);

            aggregateDomainEventApplier.applyDomainEventToAggregate(aggregate, domainEvent);

            expect(domainEvent.onApply).toHaveBeenCalledOnce();
        });

        it("should not call the onApply lifecycle hook when sequence numbers do not match", () => {
            const aggregate = new MockEventSourcedAggregateRoot();
            const domainEvent = new MockAppliedDomainEvent(faker.string.uuid()).setSequenceNumber(2);

            expect(() => {
                aggregateDomainEventApplier.applyDomainEventToAggregate(aggregate, domainEvent);
            }).toThrowError(DomainEventSequenceNumberMismatchError);
            expect(domainEvent.onApply).not.toHaveBeenCalled();
        });
    });

    describe("applyStagedDomainEventsToAggregate", () => {
        it("should apply all staged domain events to the aggregate", () => {
            const aggregate = new MockAggregateRoot();

            aggregate[IsInProcessContext] = true;
            aggregate[IsInCreationContext] = true;

            const domainEvent1 = aggregate.createDomainEvent(MockDomainEvent);
            const domainEvent2 = aggregate.createDomainEvent(MockDomainEvent);

            aggregate.stageDomainEvent(domainEvent1);
            aggregate.stageDomainEvent(domainEvent2);

            aggregateDomainEventApplier.applyStagedDomainEventsToAggregate(aggregate);

            expect(aggregate.getCurrentDomainEventSequenceNumber()).toBe(2);
            expect.assertions(3); // Expect applier to be called twice
        });

        it("should throw an error when sequence numbers do not match", () => {
            const aggregate = new MockAggregateRoot();

            aggregate[IsInProcessContext] = true;
            aggregate[IsInCreationContext] = true;

            const domainEvent1 = aggregate.createDomainEvent(MockDomainEvent);
            const domainEvent2 = aggregate.createDomainEvent(MockDomainEvent);

            aggregate.stageDomainEvent(domainEvent1);
            aggregate.stageDomainEvent(domainEvent2);

            // Simulate a sequence number mismatch
            aggregate.setCurrentDomainEventSequenceNumber(3);

            expect(() => {
                aggregateDomainEventApplier.applyStagedDomainEventsToAggregate(aggregate);
            }).toThrowError(DomainEventSequenceNumberMismatchError);
            expect.assertions(1);
        });
    });
});
