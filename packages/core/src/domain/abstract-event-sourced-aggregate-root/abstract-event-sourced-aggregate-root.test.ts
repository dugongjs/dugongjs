import { faker } from "@faker-js/faker";
import { describe, expect, it } from "vitest";
import { AbstractEventSourcedAggregateRoot } from "./abstract-event-sourced-aggregate-root.js";
import { AggregateIdAlreadySetError } from "./errors/aggregate-id-already-set.error.js";

class TestAggregateRoot extends AbstractEventSourcedAggregateRoot {}

describe("AbstractEventSourcedAggregateRoot", () => {
    describe("setId", () => {
        it("should set and get the aggregate ID", () => {
            const aggregate = new TestAggregateRoot();
            const id = faker.string.uuid();
            aggregate.setId(id);
            expect(aggregate.getId()).toBe(id);
        });

        it("should throw an error if ID is set more than once", () => {
            const aggregate = new TestAggregateRoot();
            const id = faker.string.uuid();
            aggregate.setId(id);
            expect(() => aggregate.setId(faker.string.uuid())).toThrow(AggregateIdAlreadySetError);
        });
    });

    describe("setCurrentDomainEventSequenceNumber", () => {
        it("should set and get the current event sequence number", () => {
            const aggregate = new TestAggregateRoot();
            aggregate.setCurrentDomainEventSequenceNumber(5);
            expect(aggregate.getCurrentDomainEventSequenceNumber()).toBe(5);
        });
    });

    describe("delete", () => {
        it("should mark the aggregate as deleted", () => {
            const aggregate = new TestAggregateRoot();
            expect(aggregate.isDeleted()).toBe(false);
            aggregate.delete();
            expect(aggregate.isDeleted()).toBe(true);
        });
    });
});
