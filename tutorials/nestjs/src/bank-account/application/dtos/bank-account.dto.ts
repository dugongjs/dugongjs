import type { BankAccount } from "../../domain/bank-account.aggregate.js";

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
}
