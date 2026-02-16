import type { IMessageProducer, TransactionContext } from "@dugongjs/core";
import { Partitioners, type Kafka, type Message, type Producer, type ProducerConfig } from "kafkajs";
import { MessageChannelParticipantKafkaJS } from "../../common/message-broker/message-channel-participator-kafkajs.js";

/**
 * MessageProducerKafkaJS is an implementation of the IMessageProducer interface using the KafkaJS library. It provides methods to publish messages to Kafka topics, as well as to connect and disconnect the producer.
 */
export class MessageProducerKafkaJS extends MessageChannelParticipantKafkaJS implements IMessageProducer<Message> {
    private producer: Producer;
    private isConnected: boolean = false;

    constructor(
        private readonly kafka: Kafka,
        private readonly producerConfig?: ProducerConfig
    ) {
        super();

        this.producer = this.kafka.producer({
            createPartitioner: Partitioners.DefaultPartitioner,
            ...this.producerConfig
        });
    }

    /**
     * Publishes a single message to the specified message channel (Kafka topic). The method ensures that the producer is connected before attempting to send the message.
     * @param _ TransactionContext is not used in this implementation, but is reserved for other implementations such as the outbox pattern.
     * @param messageChannelId The ID of the message channel (Kafka topic) to which the message should be published.
     * @param message The message object to be published, which should conform to the KafkaJS Message format.
     * @returns A promise that resolves when the message is successfully published, or rejects if there is an error during publishing.
     */
    public async publishMessage(
        _: TransactionContext | null,
        messageChannelId: string,
        message: Message
    ): Promise<void> {
        this.ensureConnected();

        await this.producer.send({
            topic: messageChannelId,
            messages: [message]
        });
    }

    /**
     * Publishes multiple messages to the specified message channel (Kafka topic). The method ensures that the producer is connected before attempting to send the messages.
     * @param _ TransactionContext is not used in this implementation, but is reserved for other implementations such as the outbox pattern.
     * @param messageChannelId The ID of the message channel (Kafka topic) to which the messages should be published.
     * @param messages An array of message objects to be published, which should conform to the KafkaJS Message format.
     * @returns A promise that resolves when the messages are successfully published, or rejects if there is an error during publishing.
     */
    public async publishMessages(
        _: TransactionContext | null,
        messageChannelId: string,
        messages: Message[]
    ): Promise<void> {
        this.ensureConnected();

        await this.producer.send({
            topic: messageChannelId,
            messages
        });
    }

    /**
     * Connects the Kafka producer to the Kafka cluster. This method must be called before attempting to publish any messages. If the producer is already connected, this method will have no effect.
     * @returns A promise that resolves when the producer is successfully connected, or rejects if there is an error during connection.
     * @throws An error if the producer fails to connect to the Kafka cluster.
     */
    public async connect(): Promise<void> {
        await this.producer.connect();
        this.isConnected = true;
    }

    /**
     * Disconnects the Kafka producer from the Kafka cluster. After calling this method, the producer will no longer be able to publish messages until it is connected again. If the producer is already disconnected, this method will have no effect.
     * @returns A promise that resolves when the producer is successfully disconnected, or rejects if there is an error during disconnection.
     * @throws An error if the producer fails to disconnect from the Kafka cluster.
     */
    public async disconnect(): Promise<void> {
        await this.producer.disconnect();
        this.isConnected = false;
    }

    /**
     * Ensures that the producer is created and connected before allowing messages to be published.
     * @throws An error if the producer is not created or not connected, with a message indicating the required action to resolve the issue.
     */
    private ensureConnected(): void {
        if (!this.producer) {
            throw new Error("Producer is not created. Call create() method before publishing messages.");
        }

        if (!this.isConnected) {
            throw new Error("Producer is not connected. Call connect() method before publishing messages.");
        }
    }
}
