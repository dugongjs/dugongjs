import { AbstractAggregateRoot, Aggregate, ITransactionManager } from "@dugongjs/core";
import { mock } from "vitest-mock-extended";
import { AggregateFactoryTypeOrm } from "./aggregate-factory-typeorm.js";

describe("AggregateFactoryTypeOrm", () => {
    it("should setup aggregate factory correctly", () => {
        @Aggregate("Test")
        class TestAggregate extends AbstractAggregateRoot {}

        const aggregateFactory = new AggregateFactoryTypeOrm({
            aggregateClass: TestAggregate,
            currentOrigin: "Test",
            transactionManager: mock<ITransactionManager>()
        });

        expect(aggregateFactory).toBeDefined();
    });
});
