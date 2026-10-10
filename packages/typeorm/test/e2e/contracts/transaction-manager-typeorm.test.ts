import { runTransactionManagerContractTests } from "@dugongjs/testing-contracts";
import { randomUUID } from "node:crypto";
import type { EntityManager } from "typeorm";
import { TransactionManagerTypeOrm } from "../../../src/index.js";
import { activeDriver } from "../setup/drivers/active-driver.js";
import { dataSource } from "../setup/setup/data-source.js";

runTransactionManagerContractTests(
    async () => ({
        transactionManager: new TransactionManagerTypeOrm(dataSource),
        cleanup: async () => {
            await dataSource.getRepository(activeDriver.entities.domainEvent).clear();
        },
        createProbeId: () => randomUUID(),
        persistProbe: async (context, probeId) => {
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
        hasProbe: async (probeId) => {
            const count = await dataSource.getRepository(activeDriver.entities.domainEvent).count({
                where: {
                    origin: "TransactionContract",
                    aggregateType: "ProbeAggregate",
                    aggregateId: probeId
                }
            });

            return count > 0;
        }
    }),
    { supportsConcurrentConnections: activeDriver.supportsConcurrentConnections }
);
