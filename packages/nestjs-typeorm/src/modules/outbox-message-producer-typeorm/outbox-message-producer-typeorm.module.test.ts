import { IMessageProducer } from "@dugongjs/core";
import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { mockDeep } from "vitest-mock-extended";
import { OutboxMessageProducerTypeOrmModule } from "./outbox-message-producer-typeorm.module.js";
import { OutboxMessageProducerTypeOrmService } from "./outbox-message-producer-typeorm.service.js";

describe("OutboxMessageProducerTypeOrmModule", () => {
    let app: TestingModule;
    let outboxMessageProducer: OutboxMessageProducerTypeOrmService;

    beforeEach(async () => {
        app = await Test.createTestingModule({
            imports: [TypeOrmModule.forRoot(), OutboxMessageProducerTypeOrmModule.forRoot()]
        })
            .overrideProvider(DataSource)
            .useValue(mockDeep<DataSource>())
            .compile();

        outboxMessageProducer = app.get(IMessageProducer);
    });

    it("should be defined", () => {
        expect(outboxMessageProducer).toBeDefined();
    });
});
