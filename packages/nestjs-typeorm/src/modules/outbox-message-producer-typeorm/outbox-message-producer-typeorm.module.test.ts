import { IMessageProducer } from "@dugongjs/core";
import { OutboxEntity } from "@dugongjs/typeorm";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken, TypeOrmModule } from "@nestjs/typeorm";
import { mock } from "vitest-mock-extended";
import { OutboxMessageProducerTypeOrmModule } from "./outbox-message-producer-typeorm.module.js";
import { OutboxMessageProducerTypeOrmService } from "./outbox-message-producer-typeorm.service.js";

describe("OutboxMessageProducerTypeOrmModule", () => {
    let app: TestingModule;
    let outboxMessageProducer: OutboxMessageProducerTypeOrmService;

    beforeEach(async () => {
        app = await Test.createTestingModule({
            imports: [TypeOrmModule.forFeature([OutboxEntity]), OutboxMessageProducerTypeOrmModule]
        })
            .overrideProvider(getRepositoryToken(OutboxEntity))
            .useValue(mock())
            .compile();

        outboxMessageProducer = app.get(IMessageProducer);
    });

    it("should be defined", () => {
        expect(outboxMessageProducer).toBeDefined();
    });
});
