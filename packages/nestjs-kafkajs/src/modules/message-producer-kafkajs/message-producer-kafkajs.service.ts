import { MessageProducerKafkaJS } from "@dugongjs/kafkajs";
import { Inject, Injectable, Optional, type OnModuleDestroy, type OnModuleInit } from "@nestjs/common";
import type { ProducerConfig } from "kafkajs";
import { KafkaService } from "../kafka/kafka.service.js";
import { KAFKAJS_PRODUCER_CONFIG_TOKEN } from "./message-producer-kafkajs.tokens.js";

@Injectable()
export class MessageProducerKafkaJSService extends MessageProducerKafkaJS implements OnModuleInit, OnModuleDestroy {
    constructor(
        kafkaService: KafkaService,
        @Optional() @Inject(KAFKAJS_PRODUCER_CONFIG_TOKEN) producerConfig?: ProducerConfig
    ) {
        super(kafkaService, producerConfig);
    }

    public async onModuleInit(): Promise<void> {
        await this.connect();
    }

    public async onModuleDestroy(): Promise<void> {
        await this.disconnect();
    }
}
