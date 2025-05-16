import { AbstractAggregateRoot, Aggregate } from "@dugongjs/core";
import { WaitForMessageConsumerKafkaJS } from "./wait-for-message-consumer-kafkajs.js";

describe("AggregateMessageProducerKafkaJS", () => {
    it("should setup the waiter correctly", () => {
        @Aggregate("Test")
        class TestAggregate extends AbstractAggregateRoot {}

        const waitForMessageConsumer = new WaitForMessageConsumerKafkaJS({
            aggregateClass: TestAggregate,
            currentOrigin: "Test"
        });

        expect(waitForMessageConsumer).toBeDefined();
    });
});
