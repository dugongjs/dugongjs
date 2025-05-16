import { IMessageProducer, IOutboundMessageMapper } from "@dugongjs/core";
import { Test, TestingModule } from "@nestjs/testing";
import { mock } from "vitest-mock-extended";
import { KafkaModule } from "../kafka/kafka.module.js";
import { KafkaService } from "../kafka/kafka.service.js";
import { MessageProducerKafkaJSModule } from "./message-producer-kafkajs.module.js";
import { MessageProducerKafkaJSService } from "./message-producer-kafkajs.service.js";
import type { OutboundMessageMapperKafkaJSService } from "./outbound-message-mapper-kafkajs.service.js";

describe("MessageProducerKafkaJSModule", () => {
    let app: TestingModule;
    let messageProducer: MessageProducerKafkaJSService;
    let outboundMessageMapper: OutboundMessageMapperKafkaJSService;

    beforeEach(async () => {
        app = await Test.createTestingModule({
            imports: [KafkaModule.forRoot({} as any), MessageProducerKafkaJSModule]
        })
            .overrideProvider(KafkaService)
            .useValue(mock<KafkaService>())
            .compile();

        messageProducer = app.get(IMessageProducer);
        outboundMessageMapper = app.get(IOutboundMessageMapper);
    });

    it("should be defined", () => {
        expect(messageProducer).toBeDefined();
        expect(outboundMessageMapper).toBeDefined();
    });
});
