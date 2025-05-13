import { EventSourcingService } from "@dugongjs/nestjs";
import { Injectable } from "@nestjs/common";
import { BankAccount } from "../../domain/bank-account.aggregate.js";
import type { DepositMoneyCommand } from "../../domain/commands/deposit-money.command.js";
import type { OpenAccountCommand } from "../../domain/commands/open-account.command.js";
import type { WithdrawMoneyCommand } from "../../domain/commands/withdraw-money.command.js";

@Injectable()
export class BankAccountCommandService {
    constructor(private readonly eventSourcingService: EventSourcingService) {}

    public async openAccount(command: OpenAccountCommand): Promise<BankAccount> {
        return this.eventSourcingService.transaction(async (transaction) => {
            const accountContext = this.eventSourcingService.createAggregateContext(transaction, BankAccount);

            const account = new BankAccount();

            account.openAccount(command);

            await accountContext.applyAndCommitStagedDomainEvents(account);

            return account;
        });
    }

    public async depositMoney(accountId: string, command: DepositMoneyCommand): Promise<BankAccount> {
        return this.eventSourcingService.transaction(async (transaction) => {
            const accountContext = this.eventSourcingService.createAggregateContext(transaction, BankAccount);

            const account = await accountContext.build(accountId);

            if (!account) {
                throw new Error(`BankAccount with ID ${accountId} not found.`);
            }

            account.depositMoney(command);

            await accountContext.applyAndCommitStagedDomainEvents(account);

            return account;
        });
    }

    public async withdrawMoney(accountId: string, command: WithdrawMoneyCommand): Promise<BankAccount> {
        return this.eventSourcingService.transaction(async (transaction) => {
            const accountContext = this.eventSourcingService.createAggregateContext(transaction, BankAccount);

            const account = await accountContext.build(accountId);

            if (!account) {
                throw new Error(`BankAccount with ID ${accountId} not found.`);
            }

            account.withdrawMoney(command);

            await accountContext.applyAndCommitStagedDomainEvents(account);

            return account;
        });
    }

    public async closeAccount(accountId: string): Promise<BankAccount> {
        return this.eventSourcingService.transaction(async (transaction) => {
            const accountContext = this.eventSourcingService.createAggregateContext(transaction, BankAccount);

            const account = await accountContext.build(accountId);

            if (!account) {
                throw new Error(`BankAccount with ID ${accountId} not found.`);
            }

            account.closeAccount();

            await accountContext.applyAndCommitStagedDomainEvents(account);

            return account;
        });
    }
}
