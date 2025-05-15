import { AbstractAggregateRoot, Aggregate, ITransactionManager } from "@dugongjs/core";
import { mock } from "vitest-mock-extended";
import { AggregateManagerTypeOrm } from "./aggregate-manager-typeorm.js";

describe("AggregateManagerTypeOrm", () => {
    it("should setup aggregate manager correctly", () => {
        @Aggregate("Test")
        class TestAggregate extends AbstractAggregateRoot {}

        const aggregateManager = new AggregateManagerTypeOrm({
            aggregateClass: TestAggregate,
            currentOrigin: "Test",
            transactionManager: mock<ITransactionManager>()
        });

        expect(aggregateManager).toBeDefined();
    });
});
