import type {
    ITransactionManager,
    RunInTransaction
} from "../../../ports/outbound/transaction-manager/i-transaction-manager.js";
import {
    createInMemoryTransactionContextCarrier,
    getInMemoryTransactionContext
} from "./in-memory-transaction-context.js";

export class TransactionManagerInMemory implements ITransactionManager {
    private transactionQueue: Promise<void> = Promise.resolve();

    public async transaction<TResult = unknown>(runInTransaction: RunInTransaction<TResult>): Promise<TResult> {
        const releaseCurrentTransaction = await this.acquireTransactionLock();

        const transactionContext = createInMemoryTransactionContextCarrier();

        try {
            const result = await runInTransaction(transactionContext);

            const inMemoryTransactionContext = getInMemoryTransactionContext(transactionContext);
            inMemoryTransactionContext?.commit();

            return result;
        } finally {
            releaseCurrentTransaction();
        }
    }

    private async acquireTransactionLock(): Promise<() => void> {
        let releaseCurrentTransaction: () => void = () => undefined;
        const previousTransaction = this.transactionQueue;

        this.transactionQueue = new Promise<void>((resolve) => {
            releaseCurrentTransaction = resolve;
        });

        await previousTransaction;

        return releaseCurrentTransaction;
    }
}
