import { Injectable } from "@nestjs/common";
import { BankAccount } from "src/bank-account/domain/bank-account.aggregate.js";
import { EntityManager } from "typeorm";
import { IBankAccountQueryModelWriteRepository } from "../../ports/repository/i-bank-account-query-model-Write-repository.js";
import { BankAccountQueryModelEntity } from "./bank-account-query-model.entity.js";

@Injectable()
export class BankAccountQueryModelWriteRepositoryTypeOrmService implements IBankAccountQueryModelWriteRepository {
    public async update(transactionContext: EntityManager, bankAccount: BankAccount): Promise<void> {
        const repository = transactionContext.getRepository(BankAccountQueryModelEntity);

        const queryModel = new BankAccountQueryModelEntity();
        queryModel.id = bankAccount.getId();
        queryModel.owner = bankAccount.getOwner();
        queryModel.balance = bankAccount.getBalance();

        await repository.save(queryModel);
    }

    public async delete(transactionContext: EntityManager, bankAccountId: string): Promise<void> {
        const repository = transactionContext.getRepository(BankAccountQueryModelEntity);

        await repository.delete({ id: bankAccountId });
    }
}
