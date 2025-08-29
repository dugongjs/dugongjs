import type { AggregateRoot, TransactionContext } from "@dugongjs/core";

export interface IQueryModelProjectionHandler<TAggregateRoot extends AggregateRoot> {
    getAggregateClass(): TAggregateRoot;
    updateQueryModel(transactionContext: TransactionContext, aggregate: InstanceType<TAggregateRoot>): Promise<void>;
    deleteQueryModel(transactionContext: TransactionContext, aggregateId: string): Promise<void>;
}

export const IQueryModelProjectionHandler = "IQueryModelProjectionHandler" as const;
