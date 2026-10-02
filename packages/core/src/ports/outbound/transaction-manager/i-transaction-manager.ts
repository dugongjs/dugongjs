// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- opaque marker type that adapters widen
export type TransactionContext = {};

export type RunInTransaction<TResult> = (context: TransactionContext) => Promise<TResult>;

export interface ITransactionManager {
    transaction<TResult = unknown>(runInTransaction: RunInTransaction<TResult>): Promise<TResult>;
}

export const ITransactionManager = "ITransactionManager" as const;
