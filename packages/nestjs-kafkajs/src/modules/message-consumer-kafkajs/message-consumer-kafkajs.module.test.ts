import { IInboundMessageMapper, IMessageConsumer } from "@dugongjs/core";
import { Test, TestingModule } from "@nestjs/testing";
import { mock } from "vitest-mock-extended";
import { KafkaModule } from "../kafka/kafka.module.js";
import { KafkaService } from "../kafka/kafka.service.js";
import type { InboundMessageMapperKafkaJsService } from "./inbound-message-mapper-kafkajs.service.js";
import { MessageConsumerKafkaJsModule } from "./message-consumer-kafkajs.module.js";
import { MessageConsumerKafkaJsService } from "./message-consumer-kafkajs.service.js";

describe("MessageConsumerKafkaJsModule", () => {
    let app: TestingModule;
    let messageConsumer: MessageConsumerKafkaJsService;
    let inboundMessageMapper: InboundMessageMapperKafkaJsService;

    beforeEach(async () => {
        app = await Test.createTestingModule({
            imports: [KafkaModule.forRoot({} as any), MessageConsumerKafkaJsModule]
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
