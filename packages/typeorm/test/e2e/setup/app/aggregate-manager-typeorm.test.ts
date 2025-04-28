import { AbstractAggregateRoot, Aggregate } from "@dugongjs/core";
import { AggregateManagerTypeOrm } from "./aggregate-manager-typeorm.js";

describe("AggregateManagerTypeOrm", () => {
    it("should setup aggregate manager correctly", () => {
        @Aggregate("Test")
        class TestAggregate extends AbstractAggregateRoot {}

        const aggregateManager = new AggregateManagerTypeOrm({
            aggregateClass: TestAggregate,
            currentOrigin: "Test",
            transactionContext: null
        });

        expect(aggregateManager).toBeDefined();
    });
});
