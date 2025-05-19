---
title: "Part 3 - Implementing the Application Layer (Command Side)"
sidebar_position: 4
---

![DugongJS + NestJS](/img/dugongjs_nestjs.png)

In an event-sourced system, commands and queries must be implemented separately. This is because an event log is not an ideal data structure for querying. Instead, we use the event log to enact commands and use separate database tables for querying. This separation of commands and queries is known as command query responsibility segregation (CQRS).

### Defining the Command Service

We'll begin by creating a NestJS service in the application layer that interacts with the `BankAccount` aggregate in the domain layer by calling its commands:

```typescript title="src/bank-account/application/command/bank-account.command.service.ts" showLineNumbers
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
```

### Breaking Down the Command Service

Let’s walk through how this works, starting with the constructor:

```typescript
export class BankAccountCommandService {
    constructor(private readonly eventSourcingService: EventSourcingService) {}

    // Rest of the class...
}
```

We inject `EventSourcingService` from `@dugongjs/nestjs`. This is a wrapper around the `AggregateContext`, which internally exposes the `AggregateFactory` and `AggregateManager` classes. See the [architecture overview](../core-concepts/architecture-overview.md) for more details.

The `EventSourcingService` has two methods:

1. `transaction()` which starts a transaction using the current transaction manager (since we added `TransactionManagerTypeOrmModule.forRoot()` to our `AppModule`, this starts a TypeORM transaction).
2. `createAggregateContext()` which returns an `AggregateContext` for a given aggregate class. It can be passed the `transaction` object which will then be used by all internal repository operation, ensuring transactionality.

Next, let's take a closer look at the `openAccount()` method:

```typescript
export class BankAccountCommandService {
    public async openAccount(command: OpenAccountCommand): Promise<BankAccount> {
        return this.eventSourcingService.transaction(async (transaction) => {
            const accountContext = this.eventSourcingService.createAggregateContext(transaction, BankAccount);

            const account = new BankAccount();

            account.openAccount(command);

            await accountContext.applyAndCommitStagedDomainEvents(account);

            return account;
        });
    }

    // Rest of the class...
}
```

This method follows a common pattern which lays the foundation for most application services:

1. A database transaction is started by calling `this.eventSourcingService.transaction()`. Everything running inside the `transaction` block has access to the `transaction` context.
2. An `accountContext` is created by calling `this.eventSourcingService.createAggregateContext(transaction, BankAccount)`.
3. Since we are creating a new account, no prior events exist for the aggregate. We therefore instantiate a new `BankAccount` aggregate by calling its default constructor.
4. With the aggregate instance, we call the `openAccount()` method in the domain layer. Like all commands, this method validates input and stages one or more domain events (specifically `AccountOpenedEvent` in this case).
5. `await accountContext.applyAndCommitStagedDomainEvents(account)` is called, which applies the staged domain events to the aggregate and commits them to a new event log for this aggregate instance.
6. Finally, we return the aggregate instance from the service method. Since we called `applyAndCommitStagedDomainEvents()` before returning, the generated domain events have automatically been applied and the returned aggregate is therefore immediately consistent.

In subsequent service methods, we do the exact same thing, except for one adjustment. Let's look at the `depositMoney()` method:

```typescript
export class BankAccountCommandService {
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

    // Rest of the class...
}
```

Because we are now operating on an existing aggregate instead of creating a new one, we need to invoke a factory method. We therefore call `await accountContext.build(accountId)` instead of the default constructor, which builds an instance of the aggregate from the event log (or snapshots if any exists). A crucial difference here is that the `build()` method returns an instance of the `BankAccount` aggregate **or `null`**. A `null` value may be returned for one of two reasons:

1. No domain events exists for the given aggregate ID.
2. The aggregate was successfully built, but it came back as _deleted_. This would happen if the `closeAccount()` method was called on the aggregate prior to this call.

We proceed like before by calling the `depositMoney()` command, applying and committing the domain events and returning the aggregate.

### Defining the Command Controller

Next, we'll define a NestJS controller to expose the `BankAccountCommandService` methods through. Before creating the controller, we will create a data transfer object (DTO) - a serialized version of the `BankAccount` aggregate that will be returned by API calls.

```typescript title="src/bank-account/application/dtos/bank-account.dto.ts" showLineNumbers
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
```

We create a static `fromAggregate()` method to transform the aggregate to the DTO.

Next, we define the controller. We are free to choose between multiple controller types supported by NestJS, such as REST, GraphQL, gRPC, etc. In this example, we define a simple REST controller:

```typescript title="src/bank-account/application/command/bank-account.command.controller.ts" showLineNumbers
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
```

### Defining the Command Module

Finally, we'll expose the command controller using a NestJS module:

```typescript title="src/bank-account/application/command/bank-account.command.module.ts" showLineNumbers
import { EventSourcingModule } from "@dugongjs/nestjs";
import { Module } from "@nestjs/common";
import { BankAccountCommandController } from "./bank-account.command.controller.js";
import { BankAccountCommandService } from "./bank-account.command.service.js";

@Module({
    imports: [EventSourcingModule],
    controllers: [BankAccountCommandController],
    providers: [BankAccountCommandService]
})
export class BankAccountCommandModule {}
```

Finally, we'll add the module to our `AppModule`:

```typescript title="src/app.module.ts" showLineNumbers
import { EventIssuerModule } from "@dugongjs/nestjs";
import { RepositoryTypeOrmModule, TransactionManagerTypeOrmModule } from "@dugongjs/nestjs-typeorm";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BankAccountCommandModule } from "./bank-account/application/command/bank-account.command.module.ts";
import { dataSourceOptions } from "./db/data-source-options.js";

@Module({
    imports: [
        TypeOrmModule.forRoot(dataSourceOptions),
        RepositoryTypeOrmModule.forRoot(),
        TransactionManagerTypeOrmModule.forRoot(),
        EventIssuerModule.forRoot({ currentOrigin: "BankingContext-AccountService" }),
        // highlight-next-line
        BankAccountCommandModule
    ]
})
export class AppModule {}
```

In the next part, we'll test our application by invoking commands using curl.
