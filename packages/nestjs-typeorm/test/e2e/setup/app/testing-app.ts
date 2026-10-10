import type { ModuleMetadata } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { activeDriver } from "../drivers/active-driver.js";

export type TestingApp = {
    app: TestingModule;
    dataSource: DataSource;
};

export async function createTestingApp(featureModules: ModuleMetadata["imports"]): Promise<TestingApp> {
    const app = await Test.createTestingModule({
        imports: [TypeOrmModule.forRoot(activeDriver.createDataSourceOptions()), ...(featureModules ?? [])]
    }).compile();

    return { app, dataSource: app.get(DataSource) };
}

export async function clearAllEntities(dataSource: DataSource): Promise<void> {
    const { consumedMessage, domainEvent, outbox, snapshot } = activeDriver.entities;

    await dataSource.getRepository(domainEvent).clear();
    await dataSource.getRepository(snapshot).clear();
    await dataSource.getRepository(consumedMessage).clear();
    await dataSource.getRepository(outbox).clear();
}
