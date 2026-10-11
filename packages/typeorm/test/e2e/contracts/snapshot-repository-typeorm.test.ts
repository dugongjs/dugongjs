import { runSnapshotRepositoryContractTests } from "@dugongjs/testing-contracts";
import { SnapshotRepositoryTypeOrm } from "../../../src/index.js";
import { activeDriver } from "../setup/drivers/active-driver.js";
import { dataSource } from "../setup/setup/data-source.js";

runSnapshotRepositoryContractTests(async () => ({
    repository: new SnapshotRepositoryTypeOrm(dataSource.getRepository(activeDriver.entities.snapshot)),
    cleanup: async () => {
        await dataSource.getRepository(activeDriver.entities.snapshot).clear();
    }
}));
