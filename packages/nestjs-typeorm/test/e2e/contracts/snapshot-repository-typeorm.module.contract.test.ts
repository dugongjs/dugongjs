import { ISnapshotRepository } from "@dugongjs/core";
import { runSnapshotRepositoryContractTests } from "@dugongjs/testing-contracts";
import { activeDriver } from "../setup/drivers/active-driver.js";
import { clearAllEntities, createTestingApp, type TestingApp } from "../setup/app/testing-app.js";

let testingApp: TestingApp | undefined;

async function getTestingApp(): Promise<TestingApp> {
    testingApp ??= await createTestingApp([activeDriver.modules.repository.forRoot()]);

    return testingApp;
}

runSnapshotRepositoryContractTests(async () => {
    const { app, dataSource } = await getTestingApp();

    return {
        repository: app.get<ISnapshotRepository>(ISnapshotRepository),
        cleanup: () => clearAllEntities(dataSource)
    };
});

afterAll(async () => {
    await testingApp?.app.close();
});
