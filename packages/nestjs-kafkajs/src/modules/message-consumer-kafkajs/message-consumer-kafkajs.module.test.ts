import { IInboundMessageMapper, IMessageConsumer } from "@dugongjs/core";
import { Test, TestingModule } from "@nestjs/testing";
import { mock } from "vitest-mock-extended";
import { KafkaModule } from "../kafka/kafka.module.js";
import { KafkaService } from "../kafka/kafka.service.js";
import type { InboundMessageMapperKafkaJSService } from "./inbound-message-mapper-kafkajs.service.js";
import { MessageConsumerKafkaJSModule } from "./message-consumer-kafkajs.module.js";
import { MessageConsumerKafkaJSService } from "./message-consumer-kafkajs.service.js";

describe("MessageConsumerKafkaJSModule", () => {
    let app: TestingModule;
    let messageConsumer: MessageConsumerKafkaJSService;
    let inboundMessageMapper: InboundMessageMapperKafkaJSService;

    beforeEach(async () => {
        app = await Test.createTestingModule({
            imports: [KafkaModule.forRoot({} as any), MessageConsumerKafkaJSModule]
        })
            .overrideProvider(KafkaService)
            .useValue(mock<KafkaService>())
            .compile();

        messageConsumer = app.get(IMessageConsumer);
        inboundMessageMapper = app.get(IInboundMessageMapper);
    });

    it("should be defined", () => {
        expect(messageConsumer).toBeDefined();
        expect(inboundMessageMapper).toBeDefined();
    });
});
