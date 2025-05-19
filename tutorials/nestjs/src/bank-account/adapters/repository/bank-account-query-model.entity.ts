import { Column, Entity, PrimaryColumn } from "typeorm";
import { BankAccountQueryModel } from "../../ports/repository/bank-account-query-model.js";

@Entity("bank_account_query_model")
export class BankAccountQueryModelEntity implements BankAccountQueryModel {
    @PrimaryColumn("uuid")
    public id: string;

    @Column()
    public owner: string;

    @Column()
    public balance: number;
}
