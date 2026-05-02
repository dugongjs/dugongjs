import "reflect-metadata";
import { describe, expect, it, vi } from "vitest";
import { AggregateMessageConsumerService } from "./aggregate-message-consumer.service.js";

class TestAggregate {}

describe("AggregateMessageConsumerService", () => {
    function createService(): AggregateMessageConsumerService {
        return new AggregateMessageConsumerService(
            { transaction: vi.fn() } as any,
            {} as any,
            {} as any,
            {} as any,
            {} as any,
            "CurrentOrigin"
        );
    }

    it("should throw when aggregate metadata is missing", () => {
        const service = createService();

        expect(() => service.getAggregateMessageConsumer(TestAggregate as any)).toThrow("Aggregate metadata not found");
    });

    it("should delegate registration to created aggregate consumer", async () => {
        const service = createService();
        const registerMessageConsumerForAggregate = vi.fn(async () => undefined);
        const aggregateMessageConsumer = {
            registerMessageConsumerForAggregate
        } as any;

        vi.spyOn(service, "getAggregateMessageConsumer").mockReturnValue(aggregateMessageConsumer);

        const handleMessage = vi.fn(async () => undefined);
        const options = { isAsync: true } as any;

        const result = await service.registerMessageConsumerForAggregate(
            TestAggregate as any,
            "TestConsumer",
            handleMessage,
            options
        );

        expect(service.getAggregateMessageConsumer).toHaveBeenCalledWith(TestAggregate);
        expect(registerMessageConsumerForAggregate).toHaveBeenCalledWith("TestConsumer", handleMessage, options);
        expect(result).toBe(aggregateMessageConsumer);
    });
});
