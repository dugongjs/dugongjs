import { DomainEventRepositoryInMemory } from "@dugongjs/core";
import { runDomainEventRepositoryContractTests } from "../src/index.js";

runDomainEventRepositoryContractTests(async () => ({
    repository: new DomainEventRepositoryInMemory(),
    cleanup: async () => {
        return;
    }
}));
