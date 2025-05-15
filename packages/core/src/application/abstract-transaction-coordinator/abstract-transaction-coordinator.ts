import type {
    ITransactionManager,
    RunInTransaction,
    TransactionContext
} from "../../ports/outbound/transaction-manager/i-transaction-manager.js";

export abstract class AbstractTransactionCoordinator {
    private transactionContext: TransactionContext | null = null;

    constructor(public readonly transactionManager: ITransactionManager) {}

    public async transaction<TResult = unknown>(runInTransaction: RunInTransaction<TResult>): Promise<TResult> {
        if (this.transactionContext) {
            return runInTransaction(this.transactionContext);
        }

        return this.transactionManager.transaction(async (transactionContext) => {
            this.transactionContext = transactionContext;

            try {
                return await runInTransaction(transactionContext);
            } finally {
                this.transactionContext = null;
            }
        });
    }

    public getTransactionContext(): TransactionContext | null {
        return this.transactionContext;
    }

    public setTransactionContext(transactionContext: TransactionContext | null): void {
        this.transactionContext = transactionContext;
    }
}
