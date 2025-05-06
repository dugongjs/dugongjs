import { AbstractAggregateRoot, Aggregate } from "@dugongjs/core";
import { WaitForMessageConsumerKafkajs } from "./wait-for-message-consumer-kafkajs.js";

describe("AggregateMessageProducerKafkajs", () => {
    it("should setup the waiter correctly", () => {
        @Aggregate("Test")
        class TestAggregate extends AbstractAggregateRoot {}

        const waitForMessageConsumer = new WaitForMessageConsumerKafkajs({
            aggregateClass: TestAggregate,
            currentOrigin: "Test"
        });

        expect(waitForMessageConsumer).toBeDefined();
    });
});
