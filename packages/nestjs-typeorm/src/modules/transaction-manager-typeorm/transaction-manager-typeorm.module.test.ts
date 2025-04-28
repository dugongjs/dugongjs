import { ITransactionManager } from "@dugongjs/core";
import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { mockDeep } from "vitest-mock-extended";
import { TransactionManagerTypeOrmModule } from "./transaction-manager-typeorm.module.js";

describe("TransactionManagerTypeOrmModule", () => {
    let app: TestingModule;
    let transactionManager: ITransactionManager;

    beforeEach(async () => {
        app = await Test.createTestingModule({
            imports: [TypeOrmModule.forRoot(), TransactionManagerTypeOrmModule.forRoot()]
        })
            .overrideProvider(DataSource)
            .useValue(mockDeep<DataSource>())
            .compile();

        transactionManager = app.get(ITransactionManager);
    });

    it("should be defined", () => {
        expect(transactionManager).toBeDefined();
    });
});
