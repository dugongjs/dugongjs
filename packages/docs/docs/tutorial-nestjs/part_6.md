---
title: "Part 6 - Adding a Message Broker"
sidebar_position: 7
---

![DugongJS + NestJS](/img/dugongjs_nestjs.png)

So far, we've focused on the command side of the system. However, we still lack a reliable way to query bank accounts. In this part and the next, we'll implement the query side of CQRS using a message broker to keep read models in sync with domain events.

DugongJS is built on the ports-and-adapters architecture. While it’s not strictly necessary to use this pattern in your application, we’ll stick to it here to illustrate how it works in practice. This allows us to defer infrastructure decisions until the composition stage in `AppModule`.

### Project Structure Update

We’ll start by adding two new folders to the bank-account feature module: `ports` and `adapters`. Each folder will contain a `repository` subfolder. We'll also add a `consumer` folder to the `application` folder, where message consumption will be handled:

```json
📁 bank-account
├─ 📁 adapters
│  └─ 📁 repository
│     └─ 📄 bank-account-query-model.entity.ts
│     └─ 📄 bank-account-query-model-write-repository-typeorm.service.ts
├─ 📁 application
│  └─ 📁 command
│  └─ 📁 consumer
│  │  └─ 📄 bank-account-query-model-projection-handler.service.ts
│  │  └─ 📄 bank-account-query-model-projection-consumer.module.ts
│  └─ 📁 dtos
│  └─ 📁 query
├─ 📁 domain
├─ 📁 ports
│  └─ 📁 repository
│     └─ 📄 bank-account-query-model.ts
│     └─ 📄 i-bank-account-query-model-write-repository.ts
```

### Defining the Bank Account Query Model

In the `ports/repository` folder, we define a basic interface that represents the query model:

```typescript title="src/bank-account/ports/repository/bank-account-query-model.ts"
export type BankAccountQueryModel = {
    id: string;
    owner: string;
    balance: number;
};
```

Next, we define a TypeORM entity adapter for this port:

```typescript title="src/bank-account/adapters/repository/bank-account-query-model.entity.ts"
import { Column, Entity, PrimaryColumn } from "typeorm";
import { BankAccountQueryModel } from "../../ports/repository/bank-account-query-model.js";

@Entity("bank_account_query_model")
export class BankAccountQueryModelEntity implements BankAccountQueryModel {
    @PrimaryColumn("uuid")
    public id: string;

    @Column()
    public owner: string;

    @Column()
    public balance: number;
}
```

Make sure to include this entity in `data-source-options.ts`:

```typescript title="src/db/data-source-options.ts"
import { ConsumedMessageEntity, DomainEventEntity, SnapshotEntity } from "@dugongjs/typeorm";
import type { DataSourceOptions } from "typeorm";
import { BankAccountQueryModelEntity } from "../bank-account/adapters/repository/bank-account-query-model.entity.js";

export const dataSourceOptions: DataSourceOptions = {
    type: "postgres",
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    synchronize: true,
    logging: false,
    entities: [
        DomainEventEntity,
        SnapshotEntity,
        ConsumedMessageEntity,
        // highlight-next-line
        BankAccountQueryModelEntity
    ]
};
```

### Adding an In-Memory Message Broker

To keep our query models in sync with domain events, we’ll introduce a message broker. To begin, we'll use an in-memory message broker suitable for local testing and demos.

:::warning
The in-memory broker is not suitable for production environments. In later steps, we’ll show how to replace it with Kafka or another production-ready transport.
:::

Enable it in `AppModule` by importing `MessageBrokerInMemoryModule` and calling `forRoot()`:

```typescript title="src/app.module.ts"
import { EventIssuerModule, MessageBrokerInMemoryModule } from "@dugongjs/nestjs";
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
        // highlight-next-line
        MessageBrokerInMemoryModule.forRoot(),
        BankAccountCommandModule
    ]
})
export class AppModule {}
```

With this, whenever domain events are committed, they’ll also be published to the in-memory message broker as [messages](../core-concepts/messages.md).

### Updating Query Models

To respond to these messages and update the query model, we define a new port and adapter:

```json
📁 bank-account
└─ 📁 adapters
│  └─ 📁 repository
│     └─ 📄 bank-account-query-model-write-repository-typeorm.service.ts
└─ 📁 ports
    └─ 📁 repository
       └─ 📄 i-bank-account-query-model-write-repository.ts
```

First we define the port. Notice that both methods receive a `transactionContext` as their first argument. This is because they will always be called from within a transaction:

```typescript title="src/bank-account/ports/repository/i-bank-account-query-model-write-repository.ts"
import { TransactionContext } from "@dugongjs/core";
import { BankAccount } from "../../domain/bank-account.aggregate.js";

export interface IBankAccountQueryModelWriteRepository {
    update(transactionContext: TransactionContext, bankAccount: BankAccount): Promise<void>;
    delete(transactionContext: TransactionContext, bankAccountId: string): Promise<void>;
}

export const IBankAccountQueryModelWriteRepository = "IBankAccountQueryModelWriteRepository" as const;
```

:::tip
Note that we define both an `interface` and a `const` named `IBankAccountQueryModelWriteRepository`. This is valid in TypeScript, since runtime variables and types are handled separately. The `const` serves as an _injection token_, which allows us to inject the interface in the following way:

```typescript
@Inject(IBankAccountQueryModelWriteRepository) repository: IBankAccountQueryModelWriteRepository
```

:::

Next, we implement the adapter using TypeORM:

```typescript title="src/bank-account/adapters/repository/bank-account-query-model-write-repository-typeorm.service.ts"
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
```

### Handling Projections

Next, we create a projection handler that listens for messages and calls our write repository by implementing the `IQueryModelProjectionHandler` interface from `@dugongjs/nestjs`:

```typescript title="src/bank-account/application/consumer/bank-account-query-model-projection-handler.service.ts"
import { TransactionContext } from "@dugongjs/core";
import { IQueryModelProjectionHandler } from "@dugongjs/nestjs";
import { Inject, Injectable } from "@nestjs/common";
import { BankAccount } from "../../domain/bank-account.aggregate.js";
import { IBankAccountQueryModelWriteRepository } from "../../ports/repository/i-bank-account-query-model-write-repository.js";

@Injectable()
export class BankAccountQueryModelProjectionHandlerService implements IQueryModelProjectionHandler<typeof BankAccount> {
    constructor(
        @Inject(IBankAccountQueryModelWriteRepository)
        private readonly queryModelRepository: IBankAccountQueryModelWriteRepository
    ) {}

    public getAggregateClass(): typeof BankAccount {
        return BankAccount;
    }

    public async updateQueryModel(transactionContext: TransactionContext, aggregate: BankAccount): Promise<void> {
        return this.queryModelRepository.update(transactionContext, aggregate);
    }

    public async deleteQueryModel(transactionContext: TransactionContext, aggregateId: string): Promise<void> {
        return this.queryModelRepository.delete(transactionContext, aggregateId);
    }
}
```

By implementing this interface, query models will automatically be updated and deleted when messages are received.

### Registering the Consumer Module

Finally, we'll create a module that wraps the built-in `QueryModelProjectionConsumerModule`:

```typescript title="src/bank-account/application/consumer/bank-account-query-model-projection-consumer.module.ts"
import { Constructor } from "@dugongjs/core";
import { QueryModelProjectionConsumerModule, QueryModelProjectionConsumerModuleOptions } from "@dugongjs/nestjs";
import { DynamicModule, Module } from "@nestjs/common";
import { IBankAccountQueryModelWriteRepository } from "../../ports/repository/i-bank-account-query-model-Write-repository.js";
import { BankAccountQueryModelProjectionHandlerService } from "./bank-account-query-model-projection-handler.service.js";

export type BankAccountQueryModelProjectionConsumerModuleOptions = Omit<
    QueryModelProjectionConsumerModuleOptions,
    "queryModelProjectionHandler"
> & {
    repository: Constructor<IBankAccountQueryModelWriteRepository>;
};

@Module({})
export class BankAccountQueryModelProjectionConsumerModule {
    public static register(options: BankAccountQueryModelProjectionConsumerModuleOptions): DynamicModule {
        return QueryModelProjectionConsumerModule.register({
            ...options,
            queryModelProjectionHandler: BankAccountQueryModelProjectionHandlerService,
            module: {
                imports: options.module?.imports,
                providers: [
                    ...(options.module?.providers ?? []),
                    {
                        provide: IBankAccountQueryModelWriteRepository,
                        useClass: options.repository
                    }
                ]
            }
        });
    }
}
```

This module might look complex, but it’s actually a simple wrapper around `QueryModelProjectionConsumerModule` from `@dugongjs/nestjs`. It wires up the `BankAccountQueryModelProjectionHandlerService` as the projection handler and ensures the appropriate repository is registered as a provider. It also adds optional support for injecting additional modules or providers, which may be required depending on the dependencies of the repository.

Finally, we'll register this module in `AppModule`:

```typescript title="src/app.module.ts"
import { EventIssuerModule, MessageBrokerInMemoryModule } from "@dugongjs/nestjs";
import { AggregateQueryMicroserviceModule } from "@dugongjs/nestjs-microservice-query";
import { RepositoryTypeOrmModule, TransactionManagerTypeOrmModule } from "@dugongjs/nestjs-typeorm";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BankAccountQueryModelWriteRepositoryTypeOrmService } from "./bank-account/adapters/repository/bank-account-query-model-write-repository-typeorm.service.js";
import { BankAccountCommandModule } from "./bank-account/application/command/bank-account.command.module.js";
import { BankAccountQueryModelProjectionConsumerModule } from "./bank-account/application/consumer/bank-account-query-model-projection-consumer.module.js";
import { dataSourceOptions } from "./db/data-source-options.js";

@Module({
    imports: [
        TypeOrmModule.forRoot(dataSourceOptions),
        RepositoryTypeOrmModule.forRoot(),
        TransactionManagerTypeOrmModule.forRoot(),
        EventIssuerModule.forRoot({ currentOrigin: "BankingContext-AccountService" }),
        AggregateQueryMicroserviceModule,
        MessageBrokerInMemoryModule.forRoot(),
        BankAccountCommandModule,
        // highlight-start
        BankAccountQueryModelProjectionConsumerModule.register({
            repository: BankAccountQueryModelWriteRepositoryTypeOrmService
        })
        // highlight-end
    ]
})
export class AppModule {}
```

As we are using the ports-and-adapters architecture, this is where we inject the TypeORM implementation. One of the key benefits of this architecture is that if we ever want to switch out the infrastructure or dependencies (e.g. using Prisma or Drizzle instead of TypeORM), we could do so simply by writing new adapters and updating the injected services in the `AppModule`.

If you now test the application with curl or Postman, you should see the messages being published and consumed, and the query models updated in the database.

In the next section, we'll expose the query model through a REST API.
