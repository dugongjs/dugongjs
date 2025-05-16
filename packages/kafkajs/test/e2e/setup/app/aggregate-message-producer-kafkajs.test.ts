import { AbstractAggregateRoot, Aggregate } from "@dugongjs/core";
import { AggregateMessageProducerKafkaJS } from "./aggregate-message-producer-kafkajs.js";

describe("AggregateMessageProducerKafkaJS", () => {
    it("should setup aggregate message Producer correctly", () => {
        @Aggregate("Test")
        class TestAggregate extends AbstractAggregateRoot {}

        const aggregateMessageProducer = new AggregateMessageProducerKafkaJS({
            aggregateClass: TestAggregate,
            currentOrigin: "Test"
        });

        expect(aggregateMessageProducer).toBeDefined();
    });
});
