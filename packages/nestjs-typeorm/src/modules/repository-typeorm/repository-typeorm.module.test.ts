import { IConsumedMessageRepository, IDomainEventRepository, ISnapshotRepository } from "@dugongjs/core";
import * as postgresEntities from "@dugongjs/typeorm/driver/postgres";
import * as sqliteEntities from "@dugongjs/typeorm/driver/sqlite";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken, TypeOrmModule } from "@nestjs/typeorm";
import { mock } from "vitest-mock-extended";
import * as postgresDriver from "../../driver/postgres/index.js";
import * as sqliteDriver from "../../driver/sqlite/index.js";

const drivers = [
    ["postgres", postgresDriver, postgresEntities],
    ["sqlite", sqliteDriver, sqliteEntities]
] as const;

describe("RepositoryTypeOrmModule", () => {
    describe.each(drivers)("%s", (_driver, driverModules, entities) => {
        let app: TestingModule;
        let domainEventRepository: IDomainEventRepository;
        let snapshotRepository: ISnapshotRepository;
        let consumedMessageRepository: IConsumedMessageRepository;

        beforeEach(async () => {
            app = await Test.createTestingModule({
                imports: [
                    TypeOrmModule.forFeature([
                        entities.DomainEventEntity,
                        entities.SnapshotEntity,
                        entities.ConsumedMessageEntity
                    ]),
                    driverModules.RepositoryTypeOrmModule
                ]
            })
                .overrideProvider(getRepositoryToken(entities.DomainEventEntity))
                .useValue(mock())
                .overrideProvider(getRepositoryToken(entities.SnapshotEntity))
                .useValue(mock())
                .overrideProvider(getRepositoryToken(entities.ConsumedMessageEntity))
                .useValue(mock())
                .compile();

            domainEventRepository = app.get(IDomainEventRepository);
            snapshotRepository = app.get(ISnapshotRepository);
            consumedMessageRepository = app.get(IConsumedMessageRepository);
        });

        it("should be defined", () => {
            expect(domainEventRepository).toBeDefined();
            expect(snapshotRepository).toBeDefined();
            expect(consumedMessageRepository).toBeDefined();
        });
    });

    describe("driver binding", () => {
        it("should bind a distinct module per driver", () => {
            expect(postgresDriver.RepositoryTypeOrmModule).not.toBe(sqliteDriver.RepositoryTypeOrmModule);
        });

        it("should resolve repositories through the same injection token for both drivers", () => {
            expect(postgresEntities.DomainEventEntity).not.toBe(sqliteEntities.DomainEventEntity);
            expect(getRepositoryToken(postgresEntities.DomainEventEntity)).toBe(
                getRepositoryToken(sqliteEntities.DomainEventEntity)
            );
        });
    });
});
