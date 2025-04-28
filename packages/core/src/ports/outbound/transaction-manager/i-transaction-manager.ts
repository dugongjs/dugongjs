export type TransactionContext = {};

export type RunInTransaction<TResult> = (context: TransactionContext) => Promise<TResult>;

export interface ITransactionManager {
    transaction<TResult = unknown>(runInTransaction: RunInTransaction<TResult>): Promise<TResult>;
}

export const ITransactionManager = "ITransactionManager" as const;
