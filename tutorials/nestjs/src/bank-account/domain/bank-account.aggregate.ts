import { AbstractAggregateRoot, Aggregate, Apply, CreationProcess, Process } from "@dugongjs/core";
import type { DepositMoneyCommand } from "./commands/deposit-money.command.js";
import type { OpenAccountCommand } from "./commands/open-account.command.js";
import type { WithdrawMoneyCommand } from "./commands/withdraw-money.command.js";
import { AccountClosedEvent } from "./domain-events/account-closed.event.js";
import { AccountOpenedEvent } from "./domain-events/account-opened.event.js";
import { MoneyDepositedEvent } from "./domain-events/money-deposited.event.js";
import { MoneyWithdrawnEvent } from "./domain-events/money-withdrawn.event.js";

@Aggregate("BankAccount")
export class BankAccount extends AbstractAggregateRoot {
    private owner: string;
    private balance: number;

    public getOwner(): string {
        return this.owner;
    }

    public getBalance(): number {
        return this.balance;
    }

    @CreationProcess()
    public openAccount(command: OpenAccountCommand): void {
        const event = this.createDomainEvent(AccountOpenedEvent, {
            owner: command.owner,
            initialBalance: command.initialBalance
        });

        this.stageDomainEvent(event);
    }

    @Process()
    public depositMoney(command: DepositMoneyCommand): void {
        if (command.amount <= 0) {
            throw new Error("Deposit amount must be greater than zero");
        }

        const event = this.createDomainEvent(MoneyDepositedEvent, {
            amount: command.amount
        });

        this.stageDomainEvent(event);
    }

    @Process()
    public withdrawMoney(command: WithdrawMoneyCommand): void {
        if (command.amount <= 0) {
            throw new Error("Withdraw amount must be greater than zero");
        }

        if (this.balance < command.amount) {
            throw new Error("Insufficient funds");
        }

        const event = this.createDomainEvent(MoneyWithdrawnEvent, {
            amount: command.amount
        });

        this.stageDomainEvent(event);
    }

    @Process()
    public closeAccount(): void {
        const event = this.createDomainEvent(AccountClosedEvent);

        this.stageDomainEvent(event);
    }

    @Apply(AccountOpenedEvent)
    public applyAccountOpened(event: AccountOpenedEvent): void {
        const payload = event.getPayload();

        this.owner = payload.owner;
        this.balance = payload.initialBalance;
    }

    @Apply(MoneyDepositedEvent)
    public applyMoneyDeposited(event: MoneyDepositedEvent): void {
        const payload = event.getPayload();

        this.balance += payload.amount;
    }

    @Apply(MoneyWithdrawnEvent)
    public applyMoneyWithdrawn(event: MoneyWithdrawnEvent): void {
        const payload = event.getPayload();

        this.balance -= payload.amount;
    }

    @Apply(AccountClosedEvent)
    public applyAccountClosed(): void {
        this.delete();
    }
}
