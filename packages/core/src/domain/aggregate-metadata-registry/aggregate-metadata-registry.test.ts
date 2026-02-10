import { aggregateMetadataRegistry } from "./aggregate-metadata-registry.js";
import { AggregateAlreadyRegisteredError } from "./errors/aggregate-already-registered.error.js";

class TestAggregateRoot {}
class TestDomainEvent {}

class BaseAggregate {}
class DerivedAggregate extends BaseAggregate {}

class BaseDomainEvent {}

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

    describe("registerDefaultAggregateDomainEventApplier", () => {
        it("should register a default domain event applier for an aggregate", () => {
            const applier = () => {};
            registry.registerDefaultAggregateDomainEventApplier(TestAggregateRoot, applier);

            const retrievedAppliers = registry.getAggregateDomainEventAppliers(TestAggregateRoot, TestDomainEvent)!;
            expect(retrievedAppliers[0]).toBe(applier);
        });
    });

    describe("prototype inheritance: aggregate metadata", () => {
        it("inherits aggregate metadata from base class if not defined on derived class", () => {
            registry.registerAggregateMetadata(BaseAggregate, "BaseType");

            const metadata = registry.getAggregateMetadata(DerivedAggregate);

            expect(metadata).toEqual({
                isInternal: true,
                type: "BaseType"
            });
        });

        it("prefers derived aggregate metadata over base metadata", () => {
            registry.registerAggregateMetadata(BaseAggregate, "BaseType");
            registry.registerAggregateMetadata(DerivedAggregate, "DerivedType");

            const metadata = registry.getAggregateMetadata(DerivedAggregate);

            expect(metadata).toEqual({
                isInternal: true,
                type: "DerivedType"
            });
        });
    });

    describe("prototype inheritance: snapshot metadata", () => {
        it("inherits snapshot metadata from base aggregate", () => {
            registry.registerAggregateMetadata(BaseAggregate, "BaseType");
            registry.registerAggregateSnapshotMetadata(BaseAggregate, { snapshotInterval: 50 });

            const snapshotMetadata = registry.getAggregateSnapshotMetadata(DerivedAggregate);

            expect(snapshotMetadata).toEqual({
                snapshotInterval: 50
            });
        });

        it("prefers snapshot metadata defined on derived aggregate", () => {
            registry.registerAggregateMetadata(BaseAggregate, "BaseType");
            registry.registerAggregateSnapshotMetadata(BaseAggregate, { snapshotInterval: 50 });

            registry.registerAggregateMetadata(DerivedAggregate, "DerivedType");
            registry.registerAggregateSnapshotMetadata(DerivedAggregate, { snapshotInterval: 10 });

            const snapshotMetadata = registry.getAggregateSnapshotMetadata(DerivedAggregate);

            expect(snapshotMetadata).toEqual({
                snapshotInterval: 10
            });
        });
    });

    describe("prototype inheritance: domain event appliers", () => {
        it("accumulates domain event appliers from base and derived aggregates", () => {
            const baseApplier = () => {};
            const derivedApplier = () => {};

            registry.registerAggregateDomainEventApplier(BaseAggregate, BaseDomainEvent, baseApplier);
            registry.registerAggregateDomainEventApplier(DerivedAggregate, BaseDomainEvent, derivedApplier);

            const appliers = registry.getAggregateDomainEventAppliers(DerivedAggregate, BaseDomainEvent)!;

            expect(appliers).toContain(baseApplier);
            expect(appliers).toContain(derivedApplier);
            expect(appliers.length).toBe(2);
        });

        it("accumulates default appliers across the inheritance chain", () => {
            const baseDefaultApplier = () => {};
            const derivedDefaultApplier = () => {};

            registry.registerDefaultAggregateDomainEventApplier(BaseAggregate, baseDefaultApplier);
            registry.registerDefaultAggregateDomainEventApplier(DerivedAggregate, derivedDefaultApplier);

            const appliers = registry.getAggregateDomainEventAppliers(DerivedAggregate, TestDomainEvent)!;

            expect(appliers).toContain(baseDefaultApplier);
            expect(appliers).toContain(derivedDefaultApplier);
            expect(appliers.length).toBe(2);
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
