import type { BankAccount } from "../../domain/bank-account.aggregate.js";
import type { BankAccountQueryModel } from "../../ports/repository/bank-account-query-model.js";

export class BankAccountDto {
    public id: string;
    public owner: string;
    public balance: number;

    public static fromAggregate(aggregate: BankAccount): BankAccountDto {
        const dto = new BankAccountDto();
        dto.id = aggregate.getId();
        dto.owner = aggregate.getOwner();
        dto.balance = aggregate.getBalance();

        return dto;
    }

    public static fromQueryModel(queryModel: BankAccountQueryModel): BankAccountDto {
        const dto = new BankAccountDto();
        dto.id = queryModel.id;
        dto.owner = queryModel.owner;
        dto.balance = queryModel.balance;

        return dto;
    }
}
