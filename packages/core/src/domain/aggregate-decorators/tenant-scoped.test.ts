import { AbstractAggregateRoot } from "../abstract-aggregate-root/abstract-aggregate-root.js";
import { aggregateMetadataRegistry } from "../aggregate-metadata-registry/aggregate-metadata-registry.js";
import { AggregateAlreadyRegisteredError } from "../aggregate-metadata-registry/errors/aggregate-already-registered.error.js";
import { Aggregate } from "./aggregate.js";
import { TenantScoped } from "./tenant-scoped.js";

@Aggregate("AlwaysScopedAggregate")
@TenantScoped.Always()
class AlwaysScopedAggregate extends AbstractAggregateRoot {}

@Aggregate("NeverScopedAggregate")
@TenantScoped.Never()
class NeverScopedAggregate extends AbstractAggregateRoot {}

@Aggregate("OptionallyScopedAggregate")
@TenantScoped.Optional()
class OptionallyScopedAggregate extends AbstractAggregateRoot {}

@Aggregate("UndeclaredAggregate")
class UndeclaredAggregate extends AbstractAggregateRoot {}

class DerivedFromAlwaysScopedAggregate extends AlwaysScopedAggregate {}

describe("TenantScoped", () => {
    describe("Always", () => {
        it("should register the always mode for the aggregate", () => {
            expect(aggregateMetadataRegistry.getAggregateTenancyMetadata(AlwaysScopedAggregate)).toEqual({
                mode: "always"
            });
        });
    });

    describe("Never", () => {
        it("should register the never mode for the aggregate", () => {
            expect(aggregateMetadataRegistry.getAggregateTenancyMetadata(NeverScopedAggregate)).toEqual({
                mode: "never"
            });
        });
    });

    describe("Optional", () => {
        it("should register the optional mode for the aggregate", () => {
            expect(aggregateMetadataRegistry.getAggregateTenancyMetadata(OptionallyScopedAggregate)).toEqual({
                mode: "optional"
            });
        });
    });

    describe("registry lookup", () => {
        it("should return null for an aggregate that declares no tenancy", () => {
            expect(aggregateMetadataRegistry.getAggregateTenancyMetadata(UndeclaredAggregate)).toBeNull();
        });

        it("should inherit the declaration through the prototype chain", () => {
            expect(aggregateMetadataRegistry.getAggregateTenancyMetadata(DerivedFromAlwaysScopedAggregate)).toEqual({
                mode: "always"
            });
        });

        it("should throw when an aggregate declares tenancy twice", () => {
            expect(() => {
                @TenantScoped.Always()
                @TenantScoped.Never()
                class DoublyDeclaredAggregate extends AbstractAggregateRoot {}

                return DoublyDeclaredAggregate;
            }).toThrow(AggregateAlreadyRegisteredError);
        });
    });
});
