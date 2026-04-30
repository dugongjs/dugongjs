import { runDomainEventRepositoryContractTests } from "@dugongjs/testing-contracts";
import { DomainEventEntity, DomainEventRepositoryTypeOrm } from "../../../src/index.js";
import { dataSource } from "../setup/setup/data-source.js";

runDomainEventRepositoryContractTests(async () => ({
    repository: new DomainEventRepositoryTypeOrm(dataSource.getRepository(DomainEventEntity)),
    cleanup: async () => {
        await dataSource.getRepository(DomainEventEntity).clear();
    }
}));
