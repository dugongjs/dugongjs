import { runConsumedMessageRepositoryContractTests } from "@dugongjs/testing-contracts";
import { ConsumedMessageRepositoryTypeOrm } from "../../../src/index.js";
import { activeDriver } from "../setup/drivers/active-driver.js";
import { dataSource } from "../setup/setup/data-source.js";

runConsumedMessageRepositoryContractTests(async () => ({
    repository: new ConsumedMessageRepositoryTypeOrm(dataSource.getRepository(activeDriver.entities.consumedMessage)),
    cleanup: async () => {
        await dataSource.getRepository(activeDriver.entities.consumedMessage).clear();
    }
}));
