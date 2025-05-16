import type { IMessageProducer, TransactionContext } from "@dugongjs/core";
import { Partitioners, type Kafka, type Message, type Producer, type ProducerConfig } from "kafkajs";
import { MessageChannelParticipantKafkaJS } from "../../common/message-broker/message-channel-participator-kafkajs.js";

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

    public async connect(): Promise<void> {
        await this.producer.connect();
        this.isConnected = true;
    }

    public async disconnect(): Promise<void> {
        await this.producer.disconnect();
        this.isConnected = false;
    }

    private ensureConnected(): void {
        if (!this.producer) {
            throw new Error("Producer is not created. Call create() method before publishing messages.");
        }

        if (!this.isConnected) {
            throw new Error("Producer is not connected. Call connect() method before publishing messages.");
        }
    }
}
