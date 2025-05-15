import type { AbstractAggregateRoot, RemoveAbstract, TransactionContext } from "@dugongjs/core";

export interface IQueryModelProjectionHandler<TAggregateRoot extends RemoveAbstract<typeof AbstractAggregateRoot>> {
    getAggregateClass(): TAggregateRoot;
    updateQueryModel(transactionContext: TransactionContext, aggregate: InstanceType<TAggregateRoot>): Promise<void>;
    deleteQueryModel(transactionContext: TransactionContext, aggregateId: string): Promise<void>;
}

export const IQueryModelProjectionHandler = "IQueryModelProjectionHandler" as const;
