import { MessageConsumerKafkaJS } from "@dugongjs/kafkajs";
import { Inject, Injectable, Optional, type OnModuleDestroy } from "@nestjs/common";
import type { ConsumerConfig, ConsumerRunConfig, ConsumerSubscribeTopics } from "kafkajs";
import { KafkaService } from "../kafka/kafka.service.js";
import {
    KAFKAJS_CONSUMER_CONFIG_TOKEN,
    KAFKAJS_CONSUMER_RUN_CONFIG_TOKEN,
    KAFKAJS_CONSUMER_SUBSCRIBE_TOPICS_TOKEN
} from "./message-consumer-kafkajs.tokens.js";

@Injectable()
export class MessageConsumerKafkaJSService extends MessageConsumerKafkaJS implements OnModuleDestroy {
    constructor(
        kafkaService: KafkaService,
        @Optional() @Inject(KAFKAJS_CONSUMER_CONFIG_TOKEN) consumerConfig?: ConsumerConfig,
        @Optional() @Inject(KAFKAJS_CONSUMER_SUBSCRIBE_TOPICS_TOKEN) consumerSubscribeTopics?: ConsumerSubscribeTopics,
        @Optional() @Inject(KAFKAJS_CONSUMER_RUN_CONFIG_TOKEN) consumerRunConfig?: ConsumerRunConfig
    ) {
        super(kafkaService, consumerConfig, consumerSubscribeTopics, consumerRunConfig);
    }

    public async onModuleDestroy(): Promise<void> {
        await this.disconnect();
    }
}
