import { AbstractAggregateRoot, Aggregate } from "@dugongjs/core";
import { AggregateMessageProducerKafkajs } from "./aggregate-message-producer-kafkajs.js";

describe("AggregateMessageProducerKafkajs", () => {
    it("should setup aggregate message Producer correctly", () => {
        @Aggregate("Test")
        class TestAggregate extends AbstractAggregateRoot {}

        const aggregateMessageProducer = new AggregateMessageProducerKafkajs({
            aggregateClass: TestAggregate,
            currentOrigin: "Test"
        });

        expect(aggregateMessageProducer).toBeDefined();
    });
});
