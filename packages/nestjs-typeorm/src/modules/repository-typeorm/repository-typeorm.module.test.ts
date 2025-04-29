import { IConsumedMessageRepository, IDomainEventRepository, ISnapshotRepository } from "@dugongjs/core";
import { ConsumedMessageEntity, DomainEventEntity, SnapshotEntity } from "@dugongjs/typeorm";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken, TypeOrmModule } from "@nestjs/typeorm";
import { mock } from "vitest-mock-extended";
import { RepositoryTypeOrmModule } from "./repository-typeorm.module.js";

describe("RepositoryTypeOrmModule", () => {
    let app: TestingModule;
    let domainEventRepository: IDomainEventRepository;
    let snapshotRepository: ISnapshotRepository;
    let consumedMessageRepository: IConsumedMessageRepository;

    beforeEach(async () => {
        app = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forFeature([DomainEventEntity, SnapshotEntity, ConsumedMessageEntity]),
                RepositoryTypeOrmModule
            ]
        })
            .overrideProvider(getRepositoryToken(DomainEventEntity))
            .useValue(mock())
            .overrideProvider(getRepositoryToken(SnapshotEntity))
            .useValue(mock())
            .overrideProvider(getRepositoryToken(ConsumedMessageEntity))
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
