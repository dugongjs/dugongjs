import { aggregateMetadataRegistry } from "../aggregate-metadata-registry/aggregate-metadata-registry.js";
import { Aggregate } from "./aggregate.js";

vi.mock("../aggregate-metadata-registry/aggregate-metadata-registry.js", () => ({
    aggregateMetadataRegistry: {
        registerAggregateMetadata: vi.fn()
    }
}));

describe("Aggregate Decorator", () => {
    it("should register aggregate metadata with the correct type and target", () => {
        const mockType = "TestAggregate";
        @Aggregate(mockType)
        class TestClass {}

        expect(aggregateMetadataRegistry.registerAggregateMetadata).toHaveBeenCalledWith(TestClass, mockType);
    });
});
