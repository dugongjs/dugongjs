import { AbstractAggregateRoot, Aggregate } from "@dugongjs/core";
import { AggregateMessageConsumerKafkajs } from "./aggregate-message-consumer-kafkajs.js";

describe("AggregateMessageConsumerKafkajs", () => {
    it("should setup aggregate message consumer correctly", () => {
        @Aggregate("Test")
        class TestAggregate extends AbstractAggregateRoot {}

        const aggregateMessageConsumer = new AggregateMessageConsumerKafkajs({
            aggregateClass: TestAggregate,
            currentOrigin: "Test"
        });

        expect(aggregateMessageConsumer).toBeDefined();
    });
});
