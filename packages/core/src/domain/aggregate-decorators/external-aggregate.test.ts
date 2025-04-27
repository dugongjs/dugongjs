import { aggregateMetadataRegistry } from "../aggregate-metadata-registry/aggregate-metadata-registry.js";
import { ExternalAggregate } from "./external-aggregate.js";

vi.mock("../aggregate-metadata-registry/aggregate-metadata-registry.js", () => ({
    aggregateMetadataRegistry: {
        registerExternalAggregateMetadata: vi.fn()
    }
}));

describe("ExternalAggregate Decorator", () => {
    it("should register aggregate metadata with the correct type, origin and target", () => {
        const mockType = "TestAggregate";
        const mockOrigin = "TestOrigin";
        @ExternalAggregate(mockType, mockOrigin)
        class TestClass {}

        expect(aggregateMetadataRegistry.registerExternalAggregateMetadata).toHaveBeenCalledWith(
            TestClass,
            mockType,
            mockOrigin
        );
    });
});
