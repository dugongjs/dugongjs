import { KafkaContainer, StartedKafkaContainer } from "@testcontainers/kafka";
import { Kafka } from "kafkajs";

let kafkaContainer: StartedKafkaContainer;

export async function setup() {
    console.log("Starting Kafka test container");
    kafkaContainer = await new KafkaContainer("confluentinc/cp-kafka:8.0.0").withKraft().withExposedPorts(9093).start();

    process.env.KAFKA_BOOTSTRAP_SERVER = `${kafkaContainer.getHost()}:${kafkaContainer.getMappedPort(9093)}`;

    console.log(`Waiting for Kafka to be ready at ${process.env.KAFKA_BOOTSTRAP_SERVER}...`);
    await waitForKafkaReady();
    console.log("Kafka test container is ready");
}

export async function waitForKafkaReady(timeoutMs = 10000): Promise<void> {
    const admin = new Kafka({
        clientId: "kafka-readiness-probe",
        brokers: [process.env.KAFKA_BOOTSTRAP_SERVER!]
    }).admin();
    const start = Date.now();

    await admin.connect();

    try {
        while (true) {
            try {
                await admin.fetchOffsets({
                    groupId: "__readiness_probe__",
                    topics: ["__consumer_offsets"]
                });

                return;
            } catch (err: any) {
                const isRetriable =
                    err?.type === "GROUP_COORDINATOR_NOT_AVAILABLE" ||
                    err?.type === "COORDINATOR_LOAD_IN_PROGRESS" ||
                    err?.message?.includes("coordinator");

                if (!isRetriable) {
                    throw err;
                }

                if (Date.now() - start > timeoutMs) {
                    throw new Error("Kafka did not become ready in time");
                }

                await new Promise((r) => setTimeout(r, 200));
            }
        }
    } finally {
        await admin.disconnect();
    }
}

export async function teardown() {
    await kafkaContainer.stop();
}
