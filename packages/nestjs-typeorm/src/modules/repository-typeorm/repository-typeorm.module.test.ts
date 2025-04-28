import { IConsumedMessageRepository, IDomainEventRepository, ISnapshotRepository } from "@dugongjs/core";
import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { mockDeep } from "vitest-mock-extended";
import { RepositoryTypeOrmModule } from "./repository-typeorm.module.js";

describe("RepositoryTypeOrmModule", () => {
    let app: TestingModule;
    let domainEventRepository: IDomainEventRepository;
    let snapshotRepository: ISnapshotRepository;
    let consumedMessageRepository: IConsumedMessageRepository;

    beforeEach(async () => {
        app = await Test.createTestingModule({
            imports: [TypeOrmModule.forRoot(), RepositoryTypeOrmModule.forRoot()]
        })
            .overrideProvider(DataSource)
            .useValue(mockDeep<DataSource>())
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
