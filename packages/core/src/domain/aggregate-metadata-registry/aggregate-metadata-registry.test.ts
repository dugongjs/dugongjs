import { aggregateMetadataRegistry } from "./aggregate-metadata-registry.js";
import { AggregateAlreadyRegisteredError } from "./errors/aggregate-already-registered.error.js";

class TestAggregateRoot {}
class TestDomainEvent {}

describe("AggregateMetadataRegistry", () => {
    let registry: typeof aggregateMetadataRegistry;

    beforeEach(() => {
        registry = new (aggregateMetadataRegistry.constructor as any)();
    });

    describe("registerAggregateMetadata", () => {
        it("should register internal aggregate metadata", () => {
            registry.registerAggregateMetadata(TestAggregateRoot, "TestType");

            const metadata = registry.getAggregateMetadata(TestAggregateRoot);

            expect(metadata).toEqual({
                isInternal: true,
                type: "TestType"
            });
        });

        it("should throw an error if aggregate metadata is already registered", () => {
            registry.registerAggregateMetadata(TestAggregateRoot, "TestType");

            expect(() => registry.registerAggregateMetadata(TestAggregateRoot, "TestType")).toThrow(
                AggregateAlreadyRegisteredError
            );
        });
    });

    describe("registerExternalAggregateMetadata", () => {
        it("should register external aggregate metadata", () => {
            registry.registerExternalAggregateMetadata(TestAggregateRoot, "TestType", "TestOrigin");

            const metadata = registry.getAggregateMetadata(TestAggregateRoot);

            expect(metadata).toEqual({
                isInternal: false,
                type: "TestType",
                origin: "TestOrigin"
            });
        });

        it("should throw an error if aggregate metadata is already registered", () => {
            registry.registerExternalAggregateMetadata(TestAggregateRoot, "TestType", "TestOrigin");

            expect(() =>
                registry.registerExternalAggregateMetadata(TestAggregateRoot, "TestType", "TestOrigin")
            ).toThrow(AggregateAlreadyRegisteredError);
        });
    });

    describe("registerAggregateSnapshotMetadata", () => {
        it("should register snapshot metadata for an aggregate", () => {
            registry.registerAggregateSnapshotMetadata(TestAggregateRoot, { snapshotInterval: 10 });

            const snapshotMetadata = registry.getAggregateSnapshotMetadata(TestAggregateRoot);
            expect(snapshotMetadata).toEqual({
                snapshotInterval: 10
            });
        });

        it("should throw an error if snapshot metadata is already registered", () => {
            registry.registerAggregateSnapshotMetadata(TestAggregateRoot);

            expect(() => registry.registerAggregateSnapshotMetadata(TestAggregateRoot)).toThrow(
                AggregateAlreadyRegisteredError
            );
        });
    });

    describe("registerAggregateDomainEventAppliers", () => {
        it("should register a domain event applier for an aggregate", () => {
            const applier = () => {};
            registry.registerAggregateDomainEventApplier(TestAggregateRoot, TestDomainEvent, applier);

            const retrievedAppliers = registry.getAggregateDomainEventAppliers(TestAggregateRoot, TestDomainEvent)!;
            expect(retrievedAppliers[0]).toBe(applier);
        });
    });

    describe("getAggregateClass", () => {
        it("should return the aggregate class for the given type and origin", () => {
            registry.registerExternalAggregateMetadata(TestAggregateRoot, "TestType", "TestOrigin");

            const aggregateClass = registry.getAggregateClass("TestType", "TestOrigin");
            expect(aggregateClass).toBe(TestAggregateRoot);
        });

        it("should return the aggregate class for the given type without origin", () => {
            registry.registerAggregateMetadata(TestAggregateRoot, "TestType");

            const aggregateClass = registry.getAggregateClass("TestType");
            expect(aggregateClass).toBe(TestAggregateRoot);
        });

        it("should return null if no matching aggregate class is found", () => {
            const aggregateClass = registry.getAggregateClass("NonExistentType", "NonExistentOrigin");
            expect(aggregateClass).toBeNull();
        });
    });

    describe("getAggregateTypes", () => {
        it("should return all registered aggregate types", () => {
            registry.registerAggregateMetadata(TestAggregateRoot, "TestType1");
            class AnotherAggregateRoot {}
            registry.registerAggregateMetadata(AnotherAggregateRoot, "TestType2");

            const types = registry.getAggregateTypes();
            expect(types).toEqual(["TestType1", "TestType2"]);
        });

        it("should return an empty array if no aggregates are registered", () => {
            const types = registry.getAggregateTypes();
            expect(types).toEqual([]);
        });
    });

    describe("getAllAggregateMetadata", () => {
        it("should return all registered aggregate metadata", () => {
            registry.registerAggregateMetadata(TestAggregateRoot, "TestType1");
            class AnotherAggregateRoot {}
            registry.registerExternalAggregateMetadata(AnotherAggregateRoot, "TestType2", "TestOrigin");

            const allMetadata = registry.getAllAggregateMetadata();
            expect(allMetadata.size).toBe(2);
            expect(allMetadata.get(TestAggregateRoot)).toEqual({
                isInternal: true,
                type: "TestType1"
            });
            expect(allMetadata.get(AnotherAggregateRoot)).toEqual({
                isInternal: false,
                type: "TestType2",
                origin: "TestOrigin"
            });
        });

        it("should return an empty map if no metadata is registered", () => {
            const allMetadata = registry.getAllAggregateMetadata();
            expect(allMetadata.size).toBe(0);
        });
    });

    describe("getAggregateMetadata", () => {
        it("should return null if no metadata is registered", () => {
            const metadata = registry.getAggregateMetadata(TestAggregateRoot);
            expect(metadata).toBeNull();
        });

        it("should return the registered metadata", () => {
            registry.registerAggregateMetadata(TestAggregateRoot, "TestType");

            const metadata = registry.getAggregateMetadata(TestAggregateRoot);
            expect(metadata).toEqual({
                isInternal: true,
                type: "TestType"
            });
        });
    });

    describe("clear", () => {
        it("should clear all registered metadata and appliers", () => {
            registry.registerAggregateMetadata(TestAggregateRoot, "TestType");
            registry.registerAggregateSnapshotMetadata(TestAggregateRoot);
            registry.registerAggregateDomainEventApplier(TestAggregateRoot, TestDomainEvent, () => {});

            registry.clear();

            expect(registry.getAggregateMetadata(TestAggregateRoot)).toBeNull();
            expect(registry.getAggregateSnapshotMetadata(TestAggregateRoot)).toBeNull();
            expect(registry.getAggregateDomainEventAppliers(TestAggregateRoot, TestDomainEvent)).toBeNull();
        });
    });
});
