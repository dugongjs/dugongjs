---
title: "Tutorial: NestJS"
sidebar_position: 2
---

:::danger
This tutorial is a work in progress - don't try it just yet 😉
:::

![DugongJS + NestJS](/img/dugongjs_nestjs.png)

In this tutorial, you'll learn how to set up DugongJS within a [NestJS](https://docs.nestjs.com/) application using [TypeORM](https://typeorm.io/) for persistence. We'll walk through a practical example: implementing a very simple **bank account** aggregate. Eventually, we'll also introduce [Kafka](https://kafka.apache.org/documentation/) as a message broker and see how to implement command query responsibility segregation (CQRS).

This will demonstrate how to:

- Set up a NestJS application with DugongJS.
- Use PostgreSQL and TypeORM with DugongJS adapters.
- Define aggregates, domain events, and commands.
- Set up a project structure with domain and application layers.
- Interacting with an event-sourced aggregate using the DugongJS CLI.

By the end, you'll have a working NestJS application with an event-sourced `BankAccount` aggregate.

:::info
This tutorial assumes you're already familiar with NestJS fundamentals.
:::

:::warning
This tutorial focuses on modeling the domain layer and integrating it with the NestJS application layer using DugongJS. As such, it does not cover essential application concerns like input validation, authentication, or authorization — those are outside the scope of this tutorial. However, this is critical to implement in any actual production application!
:::

## Part 1: Setting Up NestJS with ESM, Vite and TypeORM

First, create a new NestJS project by following the [NestJS First Steps guide](https://docs.nestjs.com/first-steps).

Then install the required DugongJS packages:

```bash
npm install @dugongjs/core @dugongjs/nestjs
```

### Setting Up ESM with Vite

DugongJS is built for native ECMAScript Modules (ESM), but NestJS is configured for CommonJS (CJS) by default. There are several ways to configure NestJS with ESM. In this tutorial, we'll be using [Vite](https://vite.dev/) (and [ViteNode](https://www.npmjs.com/package/vite-node) in development). If you have another preferred way of setting up ESM, feel free to skip this part.

Install the required dev dependencies:

```bash
npm install --save-dev vite vite-node vite-plugin-node
```

Then create a `vite.config.ts` file:

```typescript title="vite.config.ts"
import { defineConfig } from "vite";
import { VitePluginNode } from "vite-plugin-node";

export default defineConfig({
    build: {
        ssr: true,
        outDir: "./dist"
    },
    plugins: [
        ...VitePluginNode({
            adapter: "nest",
            appPath: "./src/main.ts",
            tsCompiler: "swc",
            outputFormat: "esm",
            swcOptions: {
                minify: false
            }
        })
    ]
});
```

Next, in `package.json,` set the `type` to `module` to declare it an ESM module and update the scripts to use `vite` for production build and `vite-node` for development.

```json title="package.json"
{
    "type": "module",
    "scripts": {
        "build": "vite build",
        "start:dev": "dotenv -e .env.public -- vite-node src/main.ts"
    }
}
```

Finally, update your `tsconfig.json` to support ESM:

```json title="tsconfig.json"
{
    "compilerOptions": {
        "module": "NodeNext",
        "moduleResolution": "NodeNext"
    }
}
```

:::warning
When using `NodeNext` module resolution, TypeScript requires all file imports to end in .js — even when importing TypeScript files. This will cause all your existing imports to error if they use the default module resolution. [Learn more](https://www.typescriptlang.org/docs/handbook/modules/theory.html#module-resolution).
:::

### Installing TypeORM and PostgreSQL

We’ll use [TypeORM](https://typeorm.io/) for persistence and configure it with PostgreSQL.

Install the following dependencies:

```bash
npm install typeorm @nestjs/typeorm @dugongjs/typeorm @dugongjs/nestjs-typeorm
```

We'll also need to install the following dev dependency:

```bash
npm install --save-dev  dotenv-cli
```

To keep things organized, we’ll store our database configuration in a dedicated folder. Add the following to your project:

```json
📁 src
└─ 📁 db
│  └─ 📄 data-source-options.ts
```

Create a data source configuration file:

```typescript title="src/db/data-source-options.ts"
import { ConsumedMessageEntity, DomainEventEntity, SnapshotEntity } from "@dugongjs/typeorm";
import type { DataSourceOptions } from "typeorm";

export const dataSourceOptions: DataSourceOptions = {
    type: "postgres",
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    synchronize: true,
    logging: false,
    entities: [DomainEventEntity, SnapshotEntity, ConsumedMessageEntity]
};
```

:::warning
Setting `synchronize: true` automatically generates tables based on your entities. This is useful during development, but should be disabled in production environments in favor of migrations.
:::

:::info
In this tutorial, we're just using `process.env` to access environmental variables, but you could also use the `ConfigModule` from `@nestjs/config` for that.
:::

Create a `.env` file at the root of your project with your database settings:

```conf
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres_user
DB_PASSWORD=postgres_password
DB_NAME=account_service_db
```

### Setting Up PostgreSQL with Docker Compose

If you don’t already have a PostgreSQL instance, you can spin one up with Docker. Create a `docker-compose.yaml` file:

```yaml
services:
    postgres:
        image: postgres:14
        container_name: banking_context_account_service_db
        restart: unless-stopped
        environment:
            POSTGRES_USER: postgres_user
            POSTGRES_PASSWORD: postgres_password
            POSTGRES_DB: account_service_db
        ports:
            - "5432:5432"
        volumes:
            - postgres_data:/var/lib/postgresql/data

volumes:
    postgres_data:
```

Start the container:

```bash
docker compose up
```

### Configuring the App Module

In `src/app.module.ts`, connect TypeORM, the DugongJS adapters, and set the current origin for event publishing:

```typescript title="src/app.module.ts"
import { EventIssuerModule } from "@dugongjs/nestjs";
import { RepositoryTypeOrmModule, TransactionManagerTypeOrmModule } from "@dugongjs/nestjs-typeorm";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { dataSourceOptions } from "./db/data-source-options.js";

@Module({
    imports: [
        TypeOrmModule.forRoot(dataSourceOptions),
        RepositoryTypeOrmModule.forRoot(),
        TransactionManagerTypeOrmModule.forRoot(),
        EventIssuerModule.forRoot({ currentOrigin: "BankingContext-AccountService" })
    ]
})
export class AppModule {}
```

Let’s break down what each module does:

- `TypeOrmModule.forRoot()` sets up TypeORM using our previously defined config.
- `RepositoryTypeOrmModule` provides adapters for the DugongJS [repository ports](../ports/repositories.md).
- `TransactionManagerTypeOrmModule` provides an adapter for the DugongJS [transaction manager port](../ports/transaction-manager.md).
- `EventIssuerModule` configures the `currentOrigin` — a label that identifies which service owns the aggregates and emits domain events. See [origin](../core-concepts/origin.md) for more details.

Next, we’ll implement the domain layer, including the aggregate, domain events, and commands for our bank account model.

## Part 2: Implementing the Domain Layer

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

However, since we are following domain-driven design, we’ll organize the code by responsibility instead. We will separate the domain layer (aggregates, events, commands) from the application layer (application services, controllers, modules). We'll also make the distinction between _commands_ and _queries_, which we'll get back to in part 3. Here is the folder structure we'll be using:

```json
📁 bank-account
└─ 📁 application
│  └─ 📁 command
│  │ └─ 📄 bank-account.command.controller.ts
│  │ └─ 📄 bank-account.command.module.ts
│  │ └─ 📄 bank-account.command.service.ts
│  └─ 📁 dtos
│  │ └─ 📄 bank-account.dto.ts
│  └─ 📁 query
│  │ └─ 📄 bank-account.query.controller.ts
│  │ └─ 📄 bank-account.query.module.ts
│  │ └─ 📄 bank-account.query.service.ts
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

```typescript title="src/bank-account/domain/domain-events/abstract-bank-account-domain-event.ts"
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

```typescript title="src/bank-account/domain/domain-events/account-opened.event.ts"
import { DomainEvent } from "@dugongjs/core";
import { AbstractBankAccountDomainEvent } from "./abstract-bank-account-domain-event.ts";

@DomainEvent()
export class AccountOpenedEvent extends AbstractBankAccountDomainEvent<{ owner: string; initialAmount: number }> {
    public static readonly type = "AccountOpened";
}
```

```typescript title="src/bank-account/domain/domain-events/account-closed.event.ts"
import { DomainEvent } from "@dugongjs/core";
import { AbstractBankAccountDomainEvent } from "./abstract-bank-account-domain-event.ts";

@DomainEvent()
export class AccountClosedEvent extends AbstractBankAccountDomainEvent {
    public static readonly type = "AccountClosed";
}
```

```typescript title="src/bank-account/domain/domain-events/money-deposited.event.ts"
import { DomainEvent } from "@dugongjs/core";
import { AbstractBankAccountDomainEvent } from "./abstract-bank-account-domain-event.ts";

@DomainEvent()
export class MoneyDepositedEvent extends AbstractBankAccountDomainEvent<{ amount: number }> {
    public static readonly type = "MoneyDeposited";
}
```

```typescript title="src/bank-account/domain/domain-events/money-withdrawn.event.ts"
import { DomainEvent } from "@dugongjs/core";
import { AbstractBankAccountDomainEvent } from "./abstract-bank-account-domain-event.ts";

@DomainEvent()
export class MoneyWithdrawnEvent extends AbstractBankAccountDomainEvent<{ amount: number }> {
    public static readonly type = "MoneyWithdrawn";
}
```

### Defining Commands

_Commands_ represent operations that can be performed on an aggregate. They are distinct from domain events in that they represent intent, not outcome.

Each command corresponds to a public method on the aggregate:

```typescript title="src/bank-account/domain/commands/open-account.command.ts"
export type OpenAccountCommand = {
    owner: string;
    initialBalance: number;
};
```

```typescript title="src/bank-account/domain/commands/deposit-money.command.ts"
export type DepositMoneyCommand = {
    amount: number;
};
```

```typescript title="src/bank-account/domain/commands/deposit-money.command.ts"
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

```typescript title="src/bank-account/domain/bank-account.aggregate.ts"
import { AbstractAggregateRoot, Aggregate, Apply, CreationProcess, Process } from "@dugongjs/core";
import type { DepositMoneyCommand } from "./commands/deposit-money.command";
import type { OpenAccountCommand } from "./commands/open-account.command";
import type { WithdrawMoneyCommand } from "./commands/withdraw-money.command";
import { AccountClosedEvent } from "./domain-events/account-closed.event";
import { AccountOpenedEvent } from "./domain-events/account-opened.event";
import { MoneyDepositedEvent } from "./domain-events/money-deposited.event";
import { MoneyWithdrawnEvent } from "./domain-events/money-withdrawn.event";

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
}
```

In the next section, we’ll expose this logic to the outside world by implementing the application layer using NestJS services and controllers.

## Part 3: Implementing the Application Layer (Command Side)

In an event-sourced system, commands and queries must be implemented separately. This is because an event log is not an ideal data structure for querying. Instead, we use the event log to enact commands and use separate database tables for querying. This separation of commands and queries is known as command query responsibility segregation (CQRS).

### Defining the Command Service

We'll begin by creating a NestJS service in the application layer that interacts with the `BankAccount` aggregate in the domain layer by calling its commands:

```typescript title="src/bank-account/application/command/bank-account.command.service.ts"
import { EventSourcingService } from "@dugongjs/nestjs";
import { Injectable } from "@nestjs/common";
import { BankAccount } from "../../domain/account.aggregate.js";
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

            account.close();

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

We inject EventSourcingService from `@dugongjs/nestjs`. This is a wrapper around the `AggregateContext`, which internally exposes the `AggregateFactory` and `AggregateManager` classes. See the [architecture overview](../core-concepts/architecture-overview.md) for more details.

The `EventSourcingService` has two methods:

1. `transaction()` which starts a transaction using the current transaction manager (since we added `TransactionManagerTypeOrmModule.forRoot()` to our `AppModule`, this starts a TypeORM transaction). This is made available through the `EventSourcingService` for convenience.
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

Because we are now operating on an existing aggregate instead of creating a new one, we need to invoke a factory method. We therefore call `await accountContext.build(accountId)` instead of the default constructor, which builds an instance of the aggregate from the event log (or snapshots if any exists). A crucial difference here is that the `build()` method returns an instance of the `BankAccount` aggregate **or `null`**. This may happen for two reasons:

1. No domain events exists for the given aggregate ID.
2. The aggregate was successfully built, but it came back as _deleted_. This would happen if the `closeAccount()` method was called on the aggregate prior to this call.

We proceed like before by calling the `depositMoney()` command, applying and committing the domain events and returning the aggregate.

### Defining the Command Controller

Next, we'll define a NestJS controller to expose the `BankAccountCommandService` methods through. Before creating the controller, we will create a data transfer object (DTO) - a serialized version of the `BankAccount` aggregate that will be returned by API calls.

```typescript title="src/bank-account/application/dtos/bank-account.dto.ts"
import type { BankAccount } from "../../domain/bank-account.aggregate.js";

export class BankAccountDto {
    public readonly id: string;
    public readonly owner: string;
    public readonly balance: number;

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

```typescript title="src/bank-account/application/command/bank-account.command.controller.ts"
import { Body, Controller, Delete, Param, Post } from "@nestjs/common";
import { BankAccountDto } from "../dtos/bank-account.dto.js";
import { BankAccountCommandService } from "./bank-account.command.service.js";

@Controller("bank-accounts")
export class BankAccountCommandController {
    constructor(private readonly bankAccountCommandService: BankAccountCommandService) {}

    @Post()
    public async openAccount(
        @Body("owner") owner: string,
        @Body("initialAmount") initialAmount: number
    ): Promise<BankAccountDto> {
        const account = await this.bankAccountCommandService.openAccount({ owner, initialAmount });

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

```typescript title="src/bank-account/application/command/bank-account.command.module.ts"
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

```typescript title="src/app.module.ts"
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
        BankAccountCommandModule
    ]
})
export class AppModule {}
```

## Part 4: Testing the Application

With everything wired up, we can start the application using the following command:

```bash
npm run start:dev
```

Your NestJS app should now be running at http://localhost:3000.

### Testing With curl

We’ll now test the `BankAccountCommandController` endpoints using curl. You can also use tools like Postman or Insomnia if you prefer a graphical interface.

```bash
curl -X POST http://localhost:3000/bank-accounts \
    -H "Content-Type: application/json" \
    -d '{"owner": "Alice", "initialAmount": 500}'
```

If everything was set up correctly, you should get a 201 response with the following body:

```json
{
    "id": "<uuid>",
    "owner": "Alice",
    "balance": 500
}
```

Using the `id` field as input for subsequent commands, try the deposit/withdraw commands:

```bash
curl -X POST http://localhost:3000/bank-accounts/<id>/deposit \
 -H "Content-Type: application/json" \
 -d '{"amount": 200}'

```

This should return a 200 response with the `balance` being 700.

```bash
curl -X POST http://localhost:3000/bank-accounts/<id>/withdraw \
 -H "Content-Type: application/json" \
 -d '{"amount": 300}'

```

This should return a 200 response with the `balance` being 400.

Finally, try closing the account:

```bash
curl -X DELETE http://localhost:3000/bank-accounts/<id>
```

This should return a 204 response with an empty body.

## Part 5: Using the `dugong` CLI

Debugging an event-sourced system poses some challenges. While database client tools (such as [pgAdmin](https://www.pgadmin.org/) for PostgreSQL) allow you to inspect the underlying data, they often fall short when it comes to understanding the behavior and aggregate state over time.

For example, you might run a query like this:

```sql
SELECT
    *
FROM
    domain_events
WHERE
    "aggregateType" = "BankAccount"
    AND "aggregateId" = '<id>'
ORDER BY
    "sequenceNumber" DESC;
```

While this gives you raw domain events, there are several limitations:

- You can inspect event payloads, but not the effect those events had on aggregate state.
- You don't know the state the aggregate was in at the time when the event was created.
- You can’t easily reconstruct or time-travel through the state of the aggregate.
- You lack type-safe tooling for filtering or formatting events.
- You’re forced to interpret raw event payloads, which can be difficult to analyze.

Luckily, DugongJS comes with a developer tool that lets you inspect and interact with event-sourced aggregates directly from the command line. This can be very useful for debugging, troubleshooting and auditing. Let's explore how it works.

### Installing the CLI

First, install the `dugong` cli:

```bash
npm install --save-dev @dugongjs/cli
```

Or alternatively, install it globally:

```bash
npm install --global @dugongjs/cli
```

Test the installation by running the following command:

```bash
dugong --help
```

### Configuring the Application For the CLI

To use the CLI, we'll need to expose an API for the CLI from our service. We'll use a [NestJS microservice](https://docs.nestjs.com/microservices/basics) to set this up.

First, install the following packages:

```bash
npm install @nestjs/microservices @dugongjs/nestjs-microservice-query
```

Next, we'll need to convert our application to a [hybrid application](https://docs.nestjs.com/faq/hybrid-application), because we'll be listening for requests from both HTTP and TCP:

```typescript title="src/main.ts"
import { NestFactory } from "@nestjs/core";
import { Transport, type MicroserviceOptions } from "@nestjs/microservices";
import { AppModule } from "./app.module.js";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.TCP,
        options: {
            host: "localhost",
            port: 3001
        }
    });

    await app.startAllMicroservices();
    await app.listen(3000);
}

bootstrap();
```

:::warning
Here, we are setting up a TCP microservice on port 3001. **This port should not be exposed to external clients, as it provides direct read-only access to all domain events and aggregates**. Instead, you should expose it on an internal port and use port-forwarding or some other secure connection when you need to access it.
:::

Finally, we'll add the `AggregateQueryMicroserviceModule` to the `AppModule`:

```typescript title="src/app.module.ts"
import { EventIssuerModule } from "@dugongjs/nestjs";
import { AggregateQueryMicroserviceModule } from "@dugongjs/nestjs-microservice-query";
import { RepositoryTypeOrmModule, TransactionManagerTypeOrmModule } from "@dugongjs/nestjs-typeorm";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BankAccountCommandModule } from "./bank-account/application/command/bank-account.command.module.js";
import { dataSourceOptions } from "./db/data-source-options.js";

@Module({
    imports: [
        TypeOrmModule.forRoot(dataSourceOptions),
        RepositoryTypeOrmModule.forRoot(),
        TransactionManagerTypeOrmModule.forRoot(),
        EventIssuerModule.forRoot({ currentOrigin: "BankingContext-AccountService" }),
        AggregateQueryMicroserviceModule,
        BankAccountCommandModule
    ]
})
export class AppModule {}
```

### Configuring the CLI

We'll first need to configure the CLI to connect to our application. The quickest way to do this is to set the current context:

```bash
dugong config set-context --current --host localhost --port 3001 --adapter nestjs-microservice --transport tcp
```

:::info
You can create and switch between multiple contexts. Run `dugong config --help` for details.
:::

### Running Basic CLI commands

Next, try running the following commands:

```bash
dugong get aggregates
```

This should display a list of your aggregates.

```bash
dugong get aggregateids BankAccount
```

This should display a list of all unique IDs of the `BankAccount` aggregates you have created.

```bash
dugong get aggregate BankAccount <id>
```

This should return a `BankAccount` aggregate by ID.

```bash
dugong get domainevents BankAccount <id>
```

This should return a list of all domain events for the `BankAccount` aggregate by ID.

### Dugong Studio

The main feature of the CLI is Dugong Studio. Start Dugong Studio by running:

```bash
dugong studio
```

This will launch an interactive terminal UI where you can explore your aggregates, time-travel in the event log and view computed diffs on aggregates based on applied domain events.

## Part 6: Adding a Message Broker

TODO

## Part 7: Implementing the Application Layer (Query Side)

TODO

## Part 8: The Outbox Pattern - Making Event Publishing Transactional

TODO
