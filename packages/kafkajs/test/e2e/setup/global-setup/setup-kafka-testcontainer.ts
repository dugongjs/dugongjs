import { KafkaContainer, StartedKafkaContainer } from "@testcontainers/kafka";

let kafkaContainer: StartedKafkaContainer;

export async function setup() {
    console.log("Starting Kafka test container");
    kafkaContainer = await new KafkaContainer().withExposedPorts(9093).start();

    const bootstrapServer = `${kafkaContainer.getHost()}:${kafkaContainer.getMappedPort(9093)}`;
    process.env.KAFKA_BOOTSTRAP_SERVER = bootstrapServer;
}

export async function teardown() {
    await kafkaContainer.stop();
}
