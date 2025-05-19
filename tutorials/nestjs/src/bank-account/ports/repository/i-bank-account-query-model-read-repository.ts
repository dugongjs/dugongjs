import { BankAccountQueryModel } from "./bank-account-query-model.js";

export interface IBankAccountQueryModelReadRepository {
    findById(id: string): Promise<BankAccountQueryModel | null>;
    findAll(): Promise<BankAccountQueryModel[]>;
}

export const IBankAccountQueryModelReadRepository = "IBankAccountQueryModelReadRepository" as const;
