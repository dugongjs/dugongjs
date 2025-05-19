import { IMessageProducer, IOutboundMessageMapper } from "@dugongjs/core";
import { OutboxEntity } from "@dugongjs/typeorm";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken, TypeOrmModule } from "@nestjs/typeorm";
import { mock } from "vitest-mock-extended";
import type { OutboxMessageMapperTypeOrmService } from "./outbox-message-mapper-typeorm.service.js";
import { OutboxMessageProducerTypeOrmModule } from "./outbox-message-producer-typeorm.module.js";
import { OutboxMessageProducerTypeOrmService } from "./outbox-message-producer-typeorm.service.js";

describe("OutboxMessageProducerTypeOrmModule", () => {
    let app: TestingModule;
    let outboxMessageProducer: OutboxMessageProducerTypeOrmService;
    let outboxMessageMapper: OutboxMessageMapperTypeOrmService;

    beforeEach(async () => {
        app = await Test.createTestingModule({
            imports: [TypeOrmModule.forFeature([OutboxEntity]), OutboxMessageProducerTypeOrmModule]
        })
            .overrideProvider(getRepositoryToken(OutboxEntity))
            .useValue(mock())
            .compile();

        outboxMessageProducer = app.get(IMessageProducer);
        outboxMessageMapper = app.get(IOutboundMessageMapper);
    });

    it("should be defined", () => {
        expect(outboxMessageProducer).toBeDefined();
        expect(outboxMessageMapper).toBeDefined();
    });
});
