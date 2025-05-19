import { TransactionContext } from "@dugongjs/core";
import { BankAccount } from "../../domain/bank-account.aggregate.js";

export interface IBankAccountQueryModelWriteRepository {
    update(transactionContext: TransactionContext, bankAccount: BankAccount): Promise<void>;
    delete(transactionContext: TransactionContext, bankAccountId: string): Promise<void>;
}

export const IBankAccountQueryModelWriteRepository = "IBankAccountQueryModelWriteRepository" as const;
