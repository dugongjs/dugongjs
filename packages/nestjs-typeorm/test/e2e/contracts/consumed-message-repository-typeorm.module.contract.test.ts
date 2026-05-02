import { IConsumedMessageRepository } from "@dugongjs/core";
import { runConsumedMessageRepositoryContractTests } from "@dugongjs/testing-contracts";
import { ConsumedMessageEntity, DomainEventEntity, SnapshotEntity } from "@dugongjs/typeorm";
import { Test, type TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { RepositoryTypeOrmModule } from "../../../src/modules/repository-typeorm/repository-typeorm.module.js";

let app: TestingModule | undefined;
let dataSource: DataSource | undefined;

async function getApp(): Promise<TestingModule> {
    if (!app) {
        app = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    type: "postgres",
                    schema: "public",
                    port: +process.env.DB_PORT!,
                    host: process.env.DB_HOST!,
                    username: process.env.DB_USERNAME!,
                    password: process.env.DB_PASSWORD!,
                    database: process.env.DB_NAME!,
                    entities: [DomainEventEntity, SnapshotEntity, ConsumedMessageEntity],
                    synchronize: true
                }),
                RepositoryTypeOrmModule.forRoot()
            ]
        }).compile();

        dataSource = app.get(DataSource);
    }

    return app;
}

runConsumedMessageRepositoryContractTests(async () => {
    const nestApp = await getApp();
    const repository = nestApp.get<IConsumedMessageRepository>(IConsumedMessageRepository);

    return {
        repository,
        cleanup: async () => {
            await dataSource!.getRepository(DomainEventEntity).clear();
            await dataSource!.getRepository(SnapshotEntity).clear();
            await dataSource!.getRepository(ConsumedMessageEntity).clear();
        }
    };
});

afterAll(async () => {
    await app?.close();
});
