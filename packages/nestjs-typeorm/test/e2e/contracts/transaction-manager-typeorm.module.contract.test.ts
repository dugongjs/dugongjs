import { ITransactionManager, type TransactionContext } from "@dugongjs/core";
import { runTransactionManagerContractTests } from "@dugongjs/testing-contracts";
import { randomUUID } from "node:crypto";
import type { EntityManager } from "typeorm";
import { TransactionManagerTypeOrmModule } from "../../../src/modules/transaction-manager-typeorm/transaction-manager-typeorm.module.js";
import { clearAllEntities, createTestingApp, type TestingApp } from "../setup/app/testing-app.js";
import { activeDriver } from "../setup/drivers/active-driver.js";

let testingApp: TestingApp | undefined;

async function getTestingApp(): Promise<TestingApp> {
    testingApp ??= await createTestingApp([TransactionManagerTypeOrmModule.forRoot()]);

    return testingApp;
}

runTransactionManagerContractTests(
    async () => {
        const { app, dataSource } = await getTestingApp();

        return {
            transactionManager: app.get<ITransactionManager>(ITransactionManager),
            cleanup: () => clearAllEntities(dataSource),
            createProbeId: () => randomUUID(),
            persistProbe: async (context: TransactionContext, probeId: string) => {
                await (context as EntityManager).getRepository(activeDriver.entities.domainEvent).insert({
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
                const count = await dataSource.getRepository(activeDriver.entities.domainEvent).count({
                    where: {
                        origin: "TransactionContract",
                        aggregateType: "ProbeAggregate",
                        aggregateId: probeId
                    }
                });

                return count > 0;
            }
        };
    },
    { supportsConcurrentConnections: activeDriver.supportsConcurrentConnections }
);

afterAll(async () => {
    await testingApp?.app.close();
});
