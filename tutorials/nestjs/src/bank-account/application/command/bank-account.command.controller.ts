import { Body, Controller, Delete, Param, Post } from "@nestjs/common";
import { BankAccountDto } from "../dtos/bank-account.dto.js";
import { BankAccountCommandService } from "./bank-account.command.service.js";

@Controller("bank-accounts")
export class BankAccountCommandController {
    constructor(private readonly bankAccountCommandService: BankAccountCommandService) {}

    @Post()
    public async openAccount(
        @Body("owner") owner: string,
        @Body("initialBalance") initialBalance: number
    ): Promise<BankAccountDto> {
        const account = await this.bankAccountCommandService.openAccount({ owner, initialBalance });

        return BankAccountDto.fromAggregate(account);
    }

    @Post(":accountId/deposit")
    public async depositMoney(
        @Param("accountId") accountId: string,
        @Body("amount") amount: number
    ): Promise<BankAccountDto> {
        const account = await this.bankAccountCommandService.depositMoney(accountId, { amount });

        return BankAccountDto.fromAggregate(account);
    }

    @Post(":accountId/withdraw")
    public async withdrawMoney(
        @Param("accountId") accountId: string,
        @Body("amount") amount: number
    ): Promise<BankAccountDto> {
        const account = await this.bankAccountCommandService.withdrawMoney(accountId, { amount });

        return BankAccountDto.fromAggregate(account);
    }

    @Delete(":accountId")
    public async closeAccount(@Param("accountId") accountId: string): Promise<void> {
        await this.bankAccountCommandService.closeAccount(accountId);
    }
}
