import { runSnapshotRepositoryContractTests } from "@dugongjs/testing-contracts";
import { SnapshotEntity, SnapshotRepositoryTypeOrm } from "../../../src/index.js";
import { dataSource } from "../setup/setup/data-source.js";

runSnapshotRepositoryContractTests(async () => ({
    repository: new SnapshotRepositoryTypeOrm(dataSource.getRepository(SnapshotEntity)),
    cleanup: async () => {
        await dataSource.getRepository(SnapshotEntity).clear();
    }
}));
