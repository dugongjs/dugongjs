import { AbstractDomainEvent } from "../abstract-domain-event/abstract-domain-event.js";
import { aggregateMetadataRegistry } from "../aggregate-metadata-registry/aggregate-metadata-registry.js";
import { Apply } from "./apply.js";

vi.mock("../aggregate-metadata-registry/aggregate-metadata-registry.js", () => ({
    aggregateMetadataRegistry: {
        registerAggregateDomainEventApplier: vi.fn(),
        registerDefaultAggregateDomainEventApplier: vi.fn()
    }
}));

describe("Apply decorator", () => {
    it("should register the domain event applier in the aggregate metadata registry", () => {
        class TestDomainEvent extends AbstractDomainEvent {
            public origin: string;
            public aggregateType: string;
            public type: string;
            public version: number;
        }
        class TestAggregate {
            @Apply(TestDomainEvent)
            handleEvent() {}
        }

        const instance = new TestAggregate();
        const method = instance.handleEvent;

        expect(aggregateMetadataRegistry.registerAggregateDomainEventApplier).toHaveBeenCalledWith(
            TestAggregate,
            TestDomainEvent,
            method
        );
    });

    it("should register the default domain event applier in the aggregate metadata registry", () => {
        class TestAggregate {
            @Apply()
            handleAllEvents() {}
        }

        const instance = new TestAggregate();
        const method = instance.handleAllEvents;

        expect(aggregateMetadataRegistry.registerDefaultAggregateDomainEventApplier).toHaveBeenCalledWith(
            TestAggregate,
            method
        );
    });
});
