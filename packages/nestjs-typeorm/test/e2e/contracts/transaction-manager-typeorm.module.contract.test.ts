import { ITransactionManager, type TransactionContext } from "@dugongjs/core";
import { runTransactionManagerContractTests } from "@dugongjs/testing-contracts";
import { DomainEventEntity } from "@dugongjs/typeorm";
import { Test, type TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { randomUUID } from "node:crypto";
import { DataSource, type EntityManager } from "typeorm";
import { TransactionManagerTypeOrmModule } from "../../../src/modules/transaction-manager-typeorm/transaction-manager-typeorm.module.js";

let app: TestingModule | undefined;
let dataSource: DataSource | undefined;

async function getApp(): Promise<TestingModule> {
    if (!app) {
        app = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    type: "postgres",
                    schema: "public",
                    port: +process.env.DB_PORT!,
                    host: process.env.DB_HOST!,
                    username: process.env.DB_USERNAME!,
                    password: process.env.DB_PASSWORD!,
                    database: process.env.DB_NAME!,
                    entities: [DomainEventEntity],
                    synchronize: true
                }),
                TransactionManagerTypeOrmModule.forRoot()
            ]
        }).compile();

        dataSource = app.get(DataSource);
    }

    return app;
}

runTransactionManagerContractTests(async () => {
    const nestApp = await getApp();
    const transactionManager = nestApp.get<ITransactionManager>(ITransactionManager);

    return {
        transactionManager,
        cleanup: async () => {
            await dataSource!.getRepository(DomainEventEntity).clear();
        },
        createProbeId: () => randomUUID(),
        persistProbe: async (context: TransactionContext, probeId: string) => {
            await (context as EntityManager).getRepository(DomainEventEntity).insert({
                id: randomUUID(),
                origin: "TransactionContract",
                aggregateType: "ProbeAggregate",
                type: "ProbeEvent",
                version: 1,
                aggregateId: probeId,
                sequenceNumber: 1,
                timestamp: new Date()
            });
        },
        hasProbe: async (probeId: string) => {
            const count = await dataSource!.getRepository(DomainEventEntity).count({
                where: {
                    origin: "TransactionContract",
                    aggregateType: "ProbeAggregate",
                    aggregateId: probeId
                }
            });

            return count > 0;
        }
    };
});

afterAll(async () => {
    await app?.close();
});
