<p align="center">
    <img src="./images/dugongjs_logo_text.png" width="400" />
</p>

<p align="center">An event sourcing framework for Node.js.</p>

## Introduction

Many popular backend frameworks, such as Express and Nest.js, excel at handling networking, request life-cycle management, and other infrastructure concerns. However, these frameworks often do not address domain-driven design (DDD) concepts like aggregates, domain events, and the complexities of modeling business logic.

Dugong bridges this gap by offering a framework centered on event sourcing and domain-driven design principles. It empowers developers to model systems that are tightly aligned with the core business logic.

### Sample use case

This example demonstrates how a bank account can be modeled as an aggregate using Dugong. We’ll define commands and domain events representing actions such as opening an account, depositing money, withdrawing funds, and closing the account.

### Defining domain events

First, we define an abstract base class for events of the bank account aggregate.

```typescript
import { AbstractDomainEvent, type DomainEventPayload } from "@dugongjs/core";

export abstract class AbstractBankAccountDomainEvent<
    TPayload extends DomainEventPayload | null = null
> extends AbstractDomainEvent<TPayload> {
    public static readonly origin = "BankingService";
    public static readonly aggregateType = "BankAccount";
    public static readonly version = 1;
}
```

Next, we define a set of domain events for the aggregate, reflecting its business capabilities. Domain events may or may not carry payloads.

```typescript
@DomainEvent()
export class AccountOpenedEvent extends AbstractBankAccountDomainEvent<{ owner: string; initialBalance: number }> {
    public static readonly type = "AccountOpened";
}

@DomainEvent()
export class MoneyDepositedEvent extends AbstractBankAccountDomainEvent<{ amount: number }> {
    public static readonly type = "MoneyDeposited";
}

@DomainEvent()
export class MoneyWithdrawnEvent extends AbstractBankAccountDomainEvent<{ amount: number }> {
    public static readonly type = "MoneyWithdrawn";
}

@DomainEvent()
export class AccountClosedEvent extends AbstractBankAccountDomainEvent {
    public static readonly type = "AccountClosed";
}
```

### Defining commands

Next, we define a set of commands for the aggregate. These can be simple types or interfaces.

```typescript
export type OpenAccountCommand = {
    owner: string;
    initialBalance: number;
};

export type DepositMoneyCommand = {
    amount: number;
};

export type WithdrawMoneyCommand = {
    amount: number;
};
```

### Defining the aggregate

Finally, we define the bank account aggregate.

```typescript
import { AbstractAggregateRoot, Aggregate, Apply, CreationProcess, Process } from "@dugongjs/core";

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
```

The functions marked with the `@Process()` decorator generate events, and the functions marked with the `@Apply()` decorator apply those events to the aggregate, updating its state. By separating command handling and state mutation, the aggregate can be fully rehydrated from the event log.

### Interacting with the aggregate

In the application layer, we may reconstruct the aggregate from the event log and execute commands on it. Here is an example using a Nest service. The `createAggregateContext` method returns an `AggregateContext` with access to factory and management methods.

```typescript
import { EventSourcingService } from "@dugongjs/nestjs";
import { Injectable } from "@nestjs/common";

@Injectable()
export class BankAccountCommandService {
    constructor(private readonly eventSourcingService: EventSourcingService) {}

    public async openAccount(command: OpenAccountCommand): Promise<BankAccount> {
        return this.eventSourcingService.transaction(async (transaction) => {
            const bankAccountContext = this.eventSourcingService.createAggregateContext(transaction, BankAccount);

            const bankAccount = new BankAccount();

            bankAccount.openAccount(command);

            await bankAccountContext.applyAndCommitStagedDomainEvents(bankAccount);

            return bankAccount;
        });
    }

    public async depositMoney(bankAccountId: string, command: DepositMoneyCommand): Promise<BankAccount> {
        return this.eventSourcingService.transaction(async (transaction) => {
            const bankAccountContext = this.eventSourcingService.createAggregateContext(transaction, BankAccount);

            const bankAccount = await bankAccountContext.build(bankAccountId);

            bankAccount.depositMoney(command);

            await bankAccountContext.applyAndCommitStagedDomainEvents(bankAccount);

            return bankAccount;
        });
    }

    public async withdrawMoney(bankAccountId: string, command: WithdrawMoneyCommand): Promise<BankAccount> {
        return this.eventSourcingService.transaction(async (transaction) => {
            const bankAccountContext = this.eventSourcingService.createAggregateContext(transaction, BankAccount);

            const bankAccount = await bankAccountContext.build(bankAccountId);

            bankAccount.withdrawMoney(command);

            await bankAccountContext.applyAndCommitStagedDomainEvents(bankAccount);

            return bankAccount;
        });
    }

    public async closeAccount(bankAccountId: string): Promise<BankAccount> {
        return this.eventSourcingService.transaction(async (transaction) => {
            const bankAccountContext = this.eventSourcingService.createAggregateContext(transaction, BankAccount);

            const bankAccount = await bankAccountContext.build(bankAccountId);

            bankAccount.closeAccount();

            await bankAccountContext.applyAndCommitStagedDomainEvents(bankAccount);

            return bankAccount;
        });
    }
}
```
