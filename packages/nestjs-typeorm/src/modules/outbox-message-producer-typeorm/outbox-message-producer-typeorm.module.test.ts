import { IMessageProducer, IOutboundMessageMapper } from "@dugongjs/core";
import * as postgresEntities from "@dugongjs/typeorm/driver/postgres";
import * as sqliteEntities from "@dugongjs/typeorm/driver/sqlite";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken, TypeOrmModule } from "@nestjs/typeorm";
import { mock } from "vitest-mock-extended";
import * as postgresDriver from "../../driver/postgres/index.js";
import * as sqliteDriver from "../../driver/sqlite/index.js";
import type { OutboxMessageMapperTypeOrmService } from "./outbox-message-mapper-typeorm.service.js";
import type { OutboxMessageProducerTypeOrmService } from "./outbox-message-producer-typeorm.service.js";

const drivers = [
    ["postgres", postgresDriver, postgresEntities],
    ["sqlite", sqliteDriver, sqliteEntities]
] as const;

describe("OutboxMessageProducerTypeOrmModule", () => {
    describe.each(drivers)("%s", (_driver, driverModules, entities) => {
        let app: TestingModule;
        let outboxMessageProducer: OutboxMessageProducerTypeOrmService;
        let outboxMessageMapper: OutboxMessageMapperTypeOrmService;

        beforeEach(async () => {
            app = await Test.createTestingModule({
                imports: [
                    TypeOrmModule.forFeature([entities.OutboxEntity]),
                    driverModules.OutboxMessageProducerTypeOrmModule
                ]
            })
                .overrideProvider(getRepositoryToken(entities.OutboxEntity))
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

    describe("driver binding", () => {
        it("should bind a distinct module per driver", () => {
            expect(postgresDriver.OutboxMessageProducerTypeOrmModule).not.toBe(
                sqliteDriver.OutboxMessageProducerTypeOrmModule
            );
        });
    });
});
