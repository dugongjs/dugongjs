---
title: "Part 7 - Implementing the Application Layer (Query Side)"
sidebar_position: 8
---

![DugongJS + NestJS](/img/dugongjs_nestjs.png)

In this part, we'll implement the query side of the application layer.

### Defining the Query Model Read Repository

First, we need to create a read repository port and adapter:

```typescript title="src/bank-account/ports/repository/i-bank-account-query-model-read-repository.ts" showLineNumbers
import { BankAccountQueryModel } from "./bank-account-query-model.js";

export interface IBankAccountQueryModelReadRepository {
    findById(id: string): Promise<BankAccountQueryModel | null>;
    findAll(): Promise<BankAccountQueryModel[]>;
}

export const IBankAccountQueryModelReadRepository = "IBankAccountQueryModelReadRepository" as const;
```

Next, we implement the adapter using TypeORM:

```typescript title="src/bank-account/adapters/repository/bank-account-query-model-read-repository-typeorm.service.ts" showLineNumbers
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BankAccountQueryModel } from "../../ports/repository/bank-account-query-model.js";
import { IBankAccountQueryModelReadRepository } from "../../ports/repository/i-bank-account-query-model-read-repository.js";
import { BankAccountQueryModelEntity } from "./bank-account-query-model.entity.js";

export class BankAccountQueryModelReadRepositoryTypeOrmService implements IBankAccountQueryModelReadRepository {
    constructor(
        @InjectRepository(BankAccountQueryModelEntity)
        private readonly bankAccountQueryModelRepository: Repository<BankAccountQueryModelEntity>
    ) {}

    public async findById(id: string): Promise<BankAccountQueryModel | null> {
        return this.bankAccountQueryModelRepository.findOne({
            where: { id }
        });
    }

    public async findAll(): Promise<BankAccountQueryModel[]> {
        return this.bankAccountQueryModelRepository.find();
    }
}
```

Unlike the write repository, these methods will be called outside transactions and will therefore need access to the `BankAccountQueryModelEntity` TypeORM repository.

### Creating the Query Service

Next, we create the `BankAccountQueryService`, which is relatively straightforward:

```typescript title="src/bank-account/application/query/bank-account.query.service.ts" showLineNumbers
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
```

### Creating the Query Controller

Before we create the query controller, we'll make a slight adjustment to the `BankAccountDTO` defined previously. Here, we add another static method to generate the DTO from the query model:

```typescript title="src/bank-account/application/dtos/bank-account.dto.ts" showLineNumbers
import type { BankAccount } from "../../domain/bank-account.aggregate.js";
import type { BankAccountQueryModel } from "../../ports/repository/bank-account-query-model.js";

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

    // highlight-start
    public static fromQueryModel(queryModel: BankAccountQueryModel): BankAccountDto {
        const dto = new BankAccountDto();
        dto.id = queryModel.id;
        dto.owner = queryModel.owner;
        dto.balance = queryModel.balance;

        return dto;
    }
    // highlight-end
}
```

This allows us to return both aggregates (from command calls) and query models (from query calls) as response objects using a common DTO.

:::info
In many cases, it makes sense to have separate DTOs for command calls and query calls. This depends entirely on the application.
:::

Next, we create a REST controller to expose the query methods:

```typescript title="src/bank-account/application/query/bank-account.query.controller.ts" showLineNumbers
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
```

### Registering the Query Module

Next, we create a module to wire everything together:

```typescript title="src/bank-account/application/query/bank-account.query.module.ts" showLineNumbers
import { Constructor } from "@dugongjs/core";
import { ModuleImports, ModuleProviders } from "@dugongjs/nestjs";
import { DynamicModule, Module } from "@nestjs/common";
import { IBankAccountQueryModelReadRepository } from "../../ports/repository/i-bank-account-query-model-read-repository.js";
import { BankAccountQueryController } from "./bank-account.query.controller.js";
import { BankAccountQueryService } from "./bank-account.query.service.js";

export type BankAccountQueryModuleOptions = {
    module?: ModuleImports & ModuleProviders;
    repository: Constructor<IBankAccountQueryModelReadRepository>;
};

@Module({
    imports: [],
    controllers: [BankAccountQueryController],
    providers: [BankAccountQueryService]
})
export class BankAccountQueryModule {
    public static register(options: BankAccountQueryModuleOptions): DynamicModule {
        return {
            module: BankAccountQueryModule,
            imports: options.module?.imports,
            providers: [
                ...(options.module?.providers ?? []),
                {
                    provide: IBankAccountQueryModelReadRepository,
                    useClass: options.repository
                }
            ]
        };
    }
}
```

Finally, we'll register this module in `AppModule`:

```typescript title="src/app.module.ts" showLineNumbers
import { EventIssuerModule, MessageBrokerInMemoryModule } from "@dugongjs/nestjs";
import { AggregateQueryMicroserviceModule } from "@dugongjs/nestjs-microservice-query";
import { RepositoryTypeOrmModule, TransactionManagerTypeOrmModule } from "@dugongjs/nestjs-typeorm";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BankAccountQueryModelReadRepositoryTypeOrmService } from "./bank-account/adapters/repository/bank-account-query-model-read-repository-typeorm.service.js";
import { BankAccountQueryModelWriteRepositoryTypeOrmService } from "./bank-account/adapters/repository/bank-account-query-model-write-repository-typeorm.service.js";
import { BankAccountQueryModelEntity } from "./bank-account/adapters/repository/bank-account-query-model.entity.js";
import { BankAccountCommandModule } from "./bank-account/application/command/bank-account.command.module.js";
import { BankAccountQueryModelProjectionConsumerModule } from "./bank-account/application/consumer/bank-account-query-model-projection-consumer.module.js";
import { BankAccountQueryModule } from "./bank-account/application/query/bank-account.query.module.js";
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
        BankAccountQueryModelProjectionConsumerModule.register({
            repository: BankAccountQueryModelWriteRepositoryTypeOrmService
        }),
        // highlight-start
        BankAccountQueryModule.register({
            module: { imports: [TypeOrmModule.forFeature([BankAccountQueryModelEntity])] },
            repository: BankAccountQueryModelReadRepositoryTypeOrmService
        })
        // highlight-end
    ]
})
export class AppModule {}
```

Here, we are relying on the `module` field in `BankAccountQueryModuleOptions` as an entry point to inject the TypeORM repository.

### Testing the Query Module

Before testing this out, make sure to reset the database, as any aggregates created up until now won't be in sync with the current changes, and will therefore not have query models.

After resetting the database, restart the server. Use curl to create a new bank account:

```bash
curl -X POST http://localhost:3000/bank-accounts \
    -H "Content-Type: application/json" \
    -d '{"owner": "Alice", "initialBalance": 500}'
```

Then make sure it can be queried:

```bash
curl http://localhost:3000/bank-accounts \
    -H "Content-Type: application/json"
```

Update the balance:

```bash
curl -X POST http://localhost:3000/bank-accounts/<id>/deposit \
    -H "Content-Type: application/json" \
    -d '{"amount": 300}'
```

Then query:

```bash
curl http://localhost:3000/bank-accounts/<id> \
    -H "Content-Type: application/json"
```

And make sure the balance is 800.

Finally, try closing the account:

```bash
curl -X DELETE http://localhost:3000/bank-accounts/<id>
```

Then query:

```bash
curl http://localhost:3000/bank-accounts/<id> \
    -H "Content-Type: application/json"
```

This should now return 404.
