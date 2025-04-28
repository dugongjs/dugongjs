import type { ITransactionManager, RunInTransaction } from "@dugongjs/core";
import type { DataSource } from "typeorm";

export class TransactionManagerTypeOrm implements ITransactionManager {
    constructor(private readonly dataSource: DataSource) {}

    public transaction<TResult = unknown>(runInTransaction: RunInTransaction<TResult>): Promise<TResult> {
        return this.dataSource.transaction(runInTransaction);
    }
}
