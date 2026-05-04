import { SnapshotRepositoryInMemory } from "@dugongjs/core";
import { runSnapshotRepositoryContractTests } from "../src/index.js";

runSnapshotRepositoryContractTests(async () => ({
    repository: new SnapshotRepositoryInMemory(),
    cleanup: async () => {
        return;
    }
}));
