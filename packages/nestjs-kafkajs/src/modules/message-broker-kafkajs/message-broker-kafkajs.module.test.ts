import { IInboundMessageMapper, IMessageConsumer, IMessageProducer, IOutboundMessageMapper } from "@dugongjs/core";
import { Test, TestingModule } from "@nestjs/testing";
import { mock } from "vitest-mock-extended";
import { KafkaModule } from "../kafka/kafka.module.js";
import { KafkaService } from "../kafka/kafka.service.js";
import type { InboundMessageMapperKafkaJSService } from "../message-consumer-kafkajs/inbound-message-mapper-kafkajs.service.js";
import type { MessageConsumerKafkaJSService } from "../message-consumer-kafkajs/message-consumer-kafkajs.service.js";
import type { MessageProducerKafkaJSService } from "../message-producer-kafkajs/message-producer-kafkajs.service.js";
import type { OutboundMessageMapperKafkaJSService } from "../message-producer-kafkajs/outbound-message-mapper-kafkajs.service.js";
import { MessageBrokerKafkaJSModule } from "./message-broker-kafkajs.module.js";

describe("MessageBrokerKafkaJS", () => {
    let app: TestingModule;
    let messageConsumer: MessageConsumerKafkaJSService;
    let messageProducer: MessageProducerKafkaJSService;
    let inboundMessageMapper: InboundMessageMapperKafkaJSService;
    let outboundMessageMapper: OutboundMessageMapperKafkaJSService;

    beforeEach(async () => {
        app = await Test.createTestingModule({
            imports: [KafkaModule.forRoot({} as any), MessageBrokerKafkaJSModule]
        })
            .overrideProvider(KafkaService)
            .useValue(mock<KafkaService>())
            .compile();

        messageConsumer = app.get(IMessageConsumer);
        messageProducer = app.get(IMessageProducer);
        inboundMessageMapper = app.get(IInboundMessageMapper);
        outboundMessageMapper = app.get(IOutboundMessageMapper);
    });

    it("should be defined", () => {
        expect(messageConsumer).toBeDefined();
        expect(messageProducer).toBeDefined();
        expect(inboundMessageMapper).toBeDefined();
        expect(outboundMessageMapper).toBeDefined();
    });
});
