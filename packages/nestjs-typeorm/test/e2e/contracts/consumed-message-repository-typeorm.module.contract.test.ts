import { IConsumedMessageRepository } from "@dugongjs/core";
import { runConsumedMessageRepositoryContractTests } from "@dugongjs/testing-contracts";
import { activeDriver } from "../setup/drivers/active-driver.js";
import { clearAllEntities, createTestingApp, type TestingApp } from "../setup/app/testing-app.js";

let testingApp: TestingApp | undefined;

async function getTestingApp(): Promise<TestingApp> {
    testingApp ??= await createTestingApp([activeDriver.modules.repository.forRoot()]);

    return testingApp;
}

runConsumedMessageRepositoryContractTests(async () => {
    const { app, dataSource } = await getTestingApp();

    return {
        repository: app.get<IConsumedMessageRepository>(IConsumedMessageRepository),
        cleanup: () => clearAllEntities(dataSource)
    };
});

afterAll(async () => {
    await testingApp?.app.close();
});
