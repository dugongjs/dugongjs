---
title: "Part 2 - Implementing the Domain Layer"
sidebar_position: 3
---

![DugongJS + NestJS](/img/dugongjs_nestjs.png)

In this part, we’ll define the core domain logic of our application: the `BankAccount` aggregate. This includes:

- Modeling the aggregate’s behavior through commands.
- Representing business events as domain events.
- Enforcing rules using event appliers and command handlers.

We will also introduce a simple project structure that separates the domain layer from the application layer, making our design more modular and aligned with DDD principles.

### Organizing the Project Structure

NestJS applications are often structured around modules and services. By default, this leads to a procedural layout like:

```json
📁 bank-account
└─ 📄 bank-account.controller.ts
└─ 📄 bank-account.module.ts
└─ 📄 bank-account.service.ts
```

However, since we are following domain-driven design, we’ll organize the code by responsibility instead. We will separate the domain layer (aggregates, events, commands) from the application layer (application services, controllers, modules). We'll also make the distinction between _commands_ and _queries_, which we'll get back to in part 3. Here is the folder structure we'll be using to get started:

```json
📁 bank-account
└─ 📁 application
│  └─ 📁 command
│  │  └─ 📄 bank-account.command.controller.ts
│  │  └─ 📄 bank-account.command.module.ts
│  │  └─ 📄 bank-account.command.service.ts
│  └─ 📁 dtos
│  │  └─ 📄 bank-account.dto.ts
└─ 📁 domain
   └─ 📁 commands
   │  └─ 📄 deposit-money.command.ts
   │  └─ 📄 open-account.command.ts
   │  └─ 📄 withdraw-money.command.ts
   └─ 📁 domain-events
   │  └─ 📄 abstract-bank-account-domain-event.ts
   │  └─ 📄 account-closed.event.ts
   │  └─ 📄 account-opened.event.ts
   │  └─ 📄 money-deposited.event.ts
   │  └─ 📄 money-withdrawn.event.ts
   └─ 📄 bank-account.aggregate.ts
```

### Defining Domain Events

In an event-sourced system, [domain events](../core-concepts/domain-events.md) represent things that have happened in the domain. For our bank account aggregate, we will implement the following events:

- `AccountOpenedEvent`
- `MoneyDepositedEvent`
- `MoneyWithdrawnEvent`
- `AccountClosedEvent`

All events for the same aggregate type should extend a common abstract base. This base defines shared metadata such as the aggregate type, origin, and version.

Create a file for the base event:

```typescript title="src/bank-account/domain/domain-events/abstract-bank-account-domain-event.ts" showLineNumbers
import { AbstractDomainEvent, type DomainEventPayload } from "@dugongjs/core";

export abstract class AbstractBankAccountDomainEvent<
    TPayload extends DomainEventPayload | null = null
> extends AbstractDomainEvent<TPayload> {
    public static readonly origin = "BankingContext-AccountService";
    public static readonly aggregateType = "BankAccount";
    public static readonly version = 1;
}
```

Now, define each concrete event by extending this base:

```typescript title="src/bank-account/domain/domain-events/account-opened.event.ts" showLineNumbers
import { DomainEvent } from "@dugongjs/core";
import { AbstractBankAccountDomainEvent } from "./abstract-bank-account-domain-event.js";

@DomainEvent()
export class AccountOpenedEvent extends AbstractBankAccountDomainEvent<{ owner: string; initialBalance: number }> {
    public static readonly type = "AccountOpened";
}
```

```typescript title="src/bank-account/domain/domain-events/account-closed.event.ts" showLineNumbers
import { DomainEvent } from "@dugongjs/core";
import { AbstractBankAccountDomainEvent } from "./abstract-bank-account-domain-event.js";

@DomainEvent()
export class AccountClosedEvent extends AbstractBankAccountDomainEvent {
    public static readonly type = "AccountClosed";
}
```

```typescript title="src/bank-account/domain/domain-events/money-deposited.event.ts" showLineNumbers
import { DomainEvent } from "@dugongjs/core";
import { AbstractBankAccountDomainEvent } from "./abstract-bank-account-domain-event.js";

@DomainEvent()
export class MoneyDepositedEvent extends AbstractBankAccountDomainEvent<{ amount: number }> {
    public static readonly type = "MoneyDeposited";
}
```

```typescript title="src/bank-account/domain/domain-events/money-withdrawn.event.ts" showLineNumbers
import { DomainEvent } from "@dugongjs/core";
import { AbstractBankAccountDomainEvent } from "./abstract-bank-account-domain-event.js";

@DomainEvent()
export class MoneyWithdrawnEvent extends AbstractBankAccountDomainEvent<{ amount: number }> {
    public static readonly type = "MoneyWithdrawn";
}
```

### Defining Commands

_Commands_ represent operations that can be performed on an aggregate. They are distinct from domain events in that they represent intent, not outcome.

Each command corresponds to a public method on the aggregate:

```typescript title="src/bank-account/domain/commands/open-account.command.ts" showLineNumbers
export type OpenAccountCommand = {
    owner: string;
    initialBalance: number;
};
```

```typescript title="src/bank-account/domain/commands/deposit-money.command.ts" showLineNumbers
export type DepositMoneyCommand = {
    amount: number;
};
```

```typescript title="src/bank-account/domain/commands/deposit-money.command.ts" showLineNumbers
export type WithdrawMoneyCommand = {
    amount: number;
};
```

### Defining the Aggregate

With commands and events in place, we can now define the `BankAccount` [aggregate](../core-concepts/aggregates.md). This is where we:

- Apply business rules.
- Handle commands.
- Stage domain events.
- Apply domain events to mutate internal state.

```typescript title="src/bank-account/domain/bank-account.aggregate.ts" showLineNumbers
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
```

In the next part, we’ll expose this logic to the outside world by implementing the application layer using NestJS services and controllers.
