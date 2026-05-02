import { IMessageProducer, IOutboundMessageMapper } from "@dugongjs/core";
import { Test, TestingModule } from "@nestjs/testing";
import { mock } from "vitest-mock-extended";
import { KafkaModule } from "../kafka/kafka.module.js";
import { KafkaService } from "../kafka/kafka.service.js";
import { MessageProducerKafkaJsModule } from "./message-producer-kafkajs.module.js";
import { MessageProducerKafkaJsService } from "./message-producer-kafkajs.service.js";
import type { OutboundMessageMapperKafkaJsService } from "./outbound-message-mapper-kafkajs.service.js";

describe("MessageProducerKafkaJsModule", () => {
    let app: TestingModule;
    let messageProducer: MessageProducerKafkaJsService;
    let outboundMessageMapper: OutboundMessageMapperKafkaJsService;

    beforeEach(async () => {
        app = await Test.createTestingModule({
            imports: [KafkaModule.forRoot({} as any), MessageProducerKafkaJsModule]
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
