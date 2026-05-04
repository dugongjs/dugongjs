import { ConsumedMessageRepositoryInMemory } from "@dugongjs/core";
import { runConsumedMessageRepositoryContractTests } from "../src/index.js";

runConsumedMessageRepositoryContractTests(async () => ({
    repository: new ConsumedMessageRepositoryInMemory(),
    cleanup: async () => {
        return;
    }
}));
