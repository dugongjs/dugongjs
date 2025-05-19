import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { BankAccountDto } from "../dtos/bank-account.dto.js";
import { BankAccountQueryService } from "./bank-account.query.service.js";

@Controller("bank-accounts")
export class BankAccountQueryController {
    constructor(private readonly bankAccountQueryService: BankAccountQueryService) {}

    @Get(":id")
    public async getBankAccountById(@Param("id") id: string): Promise<BankAccountDto> {
        const bankAccount = await this.bankAccountQueryService.getBankAccountById(id);

        if (!bankAccount) {
            throw new NotFoundException(`Bank account with id ${id} not found`);
        }

        return BankAccountDto.fromQueryModel(bankAccount);
    }

    @Get()
    public async getBankAccounts(): Promise<BankAccountDto[]> {
        const bankAccounts = await this.bankAccountQueryService.getBankAccounts();

        return bankAccounts.map((bankAccount) => BankAccountDto.fromQueryModel(bankAccount));
    }
}
