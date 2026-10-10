import { runDomainEventRepositoryContractTests } from "@dugongjs/testing-contracts";
import { DomainEventRepositoryTypeOrm } from "../../../src/index.js";
import { activeDriver } from "../setup/drivers/active-driver.js";
import { dataSource } from "../setup/setup/data-source.js";

runDomainEventRepositoryContractTests(async () => ({
    repository: new DomainEventRepositoryTypeOrm(dataSource.getRepository(activeDriver.entities.domainEvent)),
    cleanup: async () => {
        await dataSource.getRepository(activeDriver.entities.domainEvent).clear();
    }
}));
