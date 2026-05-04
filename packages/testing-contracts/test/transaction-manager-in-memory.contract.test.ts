import {
    DomainEventRepositoryInMemory,
    TransactionManagerInMemory,
    type SerializedDomainEvent,
    type TransactionContext
} from "@dugongjs/core";
import { randomUUID } from "node:crypto";
import { runTransactionManagerContractTests } from "../src/index.js";

const TRANSACTION_ORIGIN = "TransactionContract";
const TRANSACTION_AGGREGATE_TYPE = "ProbeAggregate";

function createProbeEvent(probeId: string): SerializedDomainEvent {
    return {
        id: randomUUID(),
        origin: TRANSACTION_ORIGIN,
        aggregateType: TRANSACTION_AGGREGATE_TYPE,
        type: "ProbeEvent",
        version: 1,
        aggregateId: probeId,
        sequenceNumber: 1,
        timestamp: new Date(),
        payload: null
    };
}

runTransactionManagerContractTests(async () => {
    const repository = new DomainEventRepositoryInMemory();

    return {
        transactionManager: new TransactionManagerInMemory(),
        cleanup: async () => {
            return;
        },
        createProbeId: () => randomUUID(),
        persistProbe: async (context: TransactionContext, probeId: string) => {
            await repository.saveDomainEvents(context, [createProbeEvent(probeId)]);
        },
        hasProbe: async (probeId: string) => {
            const persistedEvents = await repository.getAggregateDomainEvents(
                null,
                TRANSACTION_ORIGIN,
                TRANSACTION_AGGREGATE_TYPE,
                probeId
            );

            return persistedEvents.length > 0;
        }
    };
});
