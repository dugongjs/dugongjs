import { AbstractAggregateRoot, Aggregate } from "@dugongjs/core";
import { AggregateFactoryTypeOrm } from "./aggregate-factory-typeorm.js";

describe("AggregateFactoryTypeOrm", () => {
    it("should setup aggregate factory correctly", () => {
        @Aggregate("Test")
        class TestAggregate extends AbstractAggregateRoot {}

        const aggregateFactory = new AggregateFactoryTypeOrm({
            aggregateClass: TestAggregate,
            currentOrigin: "Test",
            transactionContext: null
        });

        expect(aggregateFactory).toBeDefined();
    });
});
