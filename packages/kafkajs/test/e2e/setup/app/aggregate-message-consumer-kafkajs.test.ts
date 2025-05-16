import { AbstractAggregateRoot, Aggregate } from "@dugongjs/core";
import { AggregateMessageConsumerKafkaJS } from "./aggregate-message-consumer-kafkajs.js";

describe("AggregateMessageConsumerKafkaJS", () => {
    it("should setup aggregate message consumer correctly", () => {
        @Aggregate("Test")
        class TestAggregate extends AbstractAggregateRoot {}

        const aggregateMessageConsumer = new AggregateMessageConsumerKafkaJS({
            aggregateClass: TestAggregate,
            currentOrigin: "Test"
        });

        expect(aggregateMessageConsumer).toBeDefined();
    });
});
