import { AggregateQueryServiceTypeOrm } from "./aggregate-query-service-typeorm.js";

describe("AggregateQueryServiceTypeOrm", () => {
    it("should setup aggregate query service correctly", () => {
        const aggregateManager = new AggregateQueryServiceTypeOrm({
            currentOrigin: "Test"
        });

        expect(aggregateManager).toBeDefined();
    });
});
