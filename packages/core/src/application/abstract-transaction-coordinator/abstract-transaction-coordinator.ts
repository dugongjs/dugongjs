import type {
    ITransactionManager,
    RunInTransaction,
    TransactionContext
} from "../../ports/outbound/transaction-manager/i-transaction-manager.js";

/**
 * Abstract class for coordinating transactions in the application layer.
 * Provides a common interface for transaction management across different components.
 */
export abstract class AbstractTransactionCoordinator {
    private transactionContext: TransactionContext | null = null;

    constructor(public readonly transactionManager: ITransactionManager) {}

    /**
     * Executes a function within a transaction context.
     * If a transaction context is already set, it will use that context.
     * Otherwise, it will create a new transaction context using the transaction manager.
     * @param runInTransaction The function to run within the transaction context.
     * @returns The result of the function executed within the transaction context.
     */
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

    /**
     * Retrieves the current transaction context.
     * If no transaction context is set, it returns null.
     * @returns The current transaction context or null if not set.
     */
    public getTransactionContext(): TransactionContext | null {
        return this.transactionContext;
    }

    /**
     * Sets the transaction context for the coordinator.
     * This is typically used to set a transaction context that has been created externally.
     * @param transactionContext The transaction context to set.
     */
    public setTransactionContext(transactionContext: TransactionContext | null): void {
        this.transactionContext = transactionContext;
    }
}
