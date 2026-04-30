import { runConsumedMessageRepositoryContractTests } from "@dugongjs/testing-contracts";
import { ConsumedMessageEntity, ConsumedMessageRepositoryTypeOrm } from "../../../src/index.js";
import { dataSource } from "../setup/setup/data-source.js";

runConsumedMessageRepositoryContractTests(async () => ({
    repository: new ConsumedMessageRepositoryTypeOrm(dataSource.getRepository(ConsumedMessageEntity)),
    cleanup: async () => {
        await dataSource.getRepository(ConsumedMessageEntity).clear();
    }
}));
