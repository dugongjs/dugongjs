import { faker } from "@faker-js/faker";
import { Type } from "class-transformer";
import { AbstractEventSourcedAggregateRoot } from "../../domain/index.js";
import { aggregateSnapshotTransformer } from "./aggregate-snapshot-transformer.js";

describe("AggregateSnapshotTransformer", () => {
    class TestAddress {
        public street: string;
        public city: string;
        public country: string;
    }

    class TestUserSnapshotable extends AbstractEventSourcedAggregateRoot {
        public name: string;
        @Type(() => TestAddress)
        public addresses: TestAddress[];
    }

    class TestUserNonSnapshotable extends AbstractEventSourcedAggregateRoot {
        public name: string;
        public addresses: TestAddress[];
    }

    describe("canBeRestoredFromSnapshot", () => {
        it("should return true for snapshotable aggregate that can be restored from snapshot", () => {
            const aggregate = new TestUserSnapshotable();
            aggregate.setId(faker.string.uuid());
            aggregate.name = faker.person.fullName();

            const address1 = new TestAddress();
            address1.street = faker.location.streetAddress();
            address1.city = faker.location.city();
            address1.country = faker.location.country();

            const address2 = new TestAddress();
            address2.street = faker.location.streetAddress();
            address2.city = faker.location.city();
            address2.country = faker.location.country();

            aggregate.addresses = [address1, address2];

            const result = aggregateSnapshotTransformer.canBeRestoredFromSnapshot(TestUserSnapshotable, aggregate);

            expect(result.isEqual).toBe(true);
        });

        it("should return false for non-snapshotable aggregate that cannot be restored from snapshot", () => {
            const aggregate = new TestUserNonSnapshotable();
            aggregate.setId(faker.string.uuid());
            aggregate.name = faker.person.fullName();

            const address1 = new TestAddress();
            address1.street = faker.location.streetAddress();
            address1.city = faker.location.city();
            address1.country = faker.location.country();

            const address2 = new TestAddress();
            address2.street = faker.location.streetAddress();
            address2.city = faker.location.city();
            address2.country = faker.location.country();

            aggregate.addresses = [address1, address2];

            const result = aggregateSnapshotTransformer.canBeRestoredFromSnapshot(TestUserNonSnapshotable, aggregate);

            expect(result.isEqual).toBe(false);
        });
    });

    describe("canBeRestoredFromSnapshot field fidelity", () => {
        class WithPrimitives extends AbstractEventSourcedAggregateRoot {
            public name = "a";
            public count = 1;
            public flag = true;
            public nothing: string | null = null;
        }

        class WithUndecoratedDate extends AbstractEventSourcedAggregateRoot {
            public at = new Date("2026-01-01T00:00:00.000Z");
        }

        class WithDecoratedDate extends AbstractEventSourcedAggregateRoot {
            @Type(() => Date)
            public at = new Date("2026-01-01T00:00:00.000Z");
        }

        class WithUndecoratedMap extends AbstractEventSourcedAggregateRoot {
            public entries = new Map<string, number>([["a", 1]]);
        }

        class WithDecoratedMap extends AbstractEventSourcedAggregateRoot {
            @Type(() => Map)
            public entries = new Map<string, number>([["a", 1]]);
        }

        function check<T extends typeof AbstractEventSourcedAggregateRoot>(aggregateClass: T): boolean {
            const aggregate = new (aggregateClass as any)();
            aggregate.setId(faker.string.uuid());

            return aggregateSnapshotTransformer.canBeRestoredFromSnapshot(aggregateClass as any, aggregate).isEqual;
        }

        it("should restore primitive and null fields", () => {
            expect(check(WithPrimitives)).toBe(true);
        });

        it("should not restore a Date field without @Type", () => {
            expect(check(WithUndecoratedDate)).toBe(false);
        });

        it("should restore a Date field decorated with @Type", () => {
            expect(check(WithDecoratedDate)).toBe(true);
        });

        it("should not restore a Map field without @Type", () => {
            expect(check(WithUndecoratedMap)).toBe(false);
        });

        it("should restore a Map field decorated with @Type", () => {
            expect(check(WithDecoratedMap)).toBe(true);
        });
    });
});
