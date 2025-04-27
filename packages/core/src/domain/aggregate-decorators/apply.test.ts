import { AbstractDomainEvent } from "../abstract-domain-event/abstract-domain-event.js";
import { aggregateMetadataRegistry } from "../aggregate-metadata-registry/aggregate-metadata-registry.js";
import { Apply } from "./apply.js";

vi.mock("../aggregate-metadata-registry/aggregate-metadata-registry.js", () => ({
    aggregateMetadataRegistry: {
        registerAggregateDomainEventApplier: vi.fn()
    }
}));

describe("Apply decorator", () => {
    it("should register the domain event applier in the aggregate metadata registry", () => {
        class TestDomainEvent extends AbstractDomainEvent {}
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
});
