import { Kafka } from "kafkajs";

let kafka: Kafka;

beforeAll(async () => {
    kafka = new Kafka({ brokers: [`${process.env.KAFKA_BOOTSTRAP_SERVER}`] });
});

export { kafka };
