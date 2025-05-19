import { Inject, Injectable } from "@nestjs/common";
import { BankAccountQueryModel } from "../../ports/repository/bank-account-query-model.js";
import { IBankAccountQueryModelReadRepository } from "../../ports/repository/i-bank-account-query-model-read-repository.js";

@Injectable()
export class BankAccountQueryService {
    constructor(
        @Inject(IBankAccountQueryModelReadRepository)
        private readonly bankAccountRepository: IBankAccountQueryModelReadRepository
    ) {}

    public async getBankAccountById(id: string): Promise<BankAccountQueryModel | null> {
        return this.bankAccountRepository.findById(id);
    }

    public async getBankAccounts(): Promise<BankAccountQueryModel[]> {
        return this.bankAccountRepository.findAll();
    }
}
