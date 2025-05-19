import { TransactionContext } from "@dugongjs/core";
import { IQueryModelProjectionHandler } from "@dugongjs/nestjs";
import { Inject, Injectable } from "@nestjs/common";
import { BankAccount } from "../../domain/bank-account.aggregate.js";
import { IBankAccountQueryModelWriteRepository } from "../../ports/repository/i-bank-account-query-model-write-repository.js";

@Injectable()
export class BankAccountQueryModelProjectionHandlerService implements IQueryModelProjectionHandler<typeof BankAccount> {
    constructor(
        @Inject(IBankAccountQueryModelWriteRepository)
        private readonly queryModelRepository: IBankAccountQueryModelWriteRepository
    ) {}

    public getAggregateClass(): typeof BankAccount {
        return BankAccount;
    }

    public async updateQueryModel(transactionContext: TransactionContext, aggregate: BankAccount): Promise<void> {
        return this.queryModelRepository.update(transactionContext, aggregate);
    }

    public async deleteQueryModel(transactionContext: TransactionContext, aggregateId: string): Promise<void> {
        return this.queryModelRepository.delete(transactionContext, aggregateId);
    }
}
