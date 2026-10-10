---
title: TypeORM
sidebar_position: 1
---

The `@dugongjs/typeorm` package provides adapter implementations for [TypeORM](https://typeorm.io/).

It has adapters for the following ports:

| Port                                                                                | Adapter                            |
| ----------------------------------------------------------------------------------- | ---------------------------------- |
| [`IDomainEventRepository`](../ports/repositories.md#idomaineventrepository)         | `DomainEventRepositoryTypeOrm`     |
| [`ISnapshotRepository`](../ports/repositories.md#isnapshotrepository)               | `SnapshotRepositoryTypeOrm`        |
| [`IConsumedMessageRepository`](../ports/repositories.md#iconsumedmessagerepository) | `ConsumedMessageRepositoryTypeOrm` |
| [`ITransactionManager`](../ports/transaction-manager.md#itransactionmanager)        | `TransactionManagerTypeOrm`        |
| [`IMessageProducer`](../ports/message-producer.md#imessageproducer)                 | `OutboxMessageProducerTypeOrm`     |
| [`IOutboundMessageMapper`](../ports/message-mappers.md#ioutboundmessagemapper)      | `OutboxMessageMapperTypeOrm`       |

### Installation

To get started, install the following packages:

```bash npm2yarn
npm install typeorm @dugongjs/typeorm
```

### Database drivers

The adapters are database agnostic, but the entity definitions differ between databases. Each supported database therefore has its own entity set, with a dedicated import:

| Database   | Import                              | Driver package   |
| ---------- | ----------------------------------- | ---------------- |
| PostgreSQL | `@dugongjs/typeorm/driver/postgres` | `pg`             |
| SQLite     | `@dugongjs/typeorm/driver/sqlite`   | `better-sqlite3` |

The entity classes are named the same in both, so moving between databases changes only the import path:

```typescript
import { DomainEventEntity } from "@dugongjs/typeorm/driver/postgres";
// or
import { DomainEventEntity } from "@dugongjs/typeorm/driver/sqlite";
```

Install the driver package for your database alongside TypeORM, as you would for any TypeORM project:

```bash npm2yarn
npm install better-sqlite3
```

:::info
Importing entities directly from `@dugongjs/typeorm` resolves to PostgreSQL by default.
:::

### Configuring `DataSource`

Follow the TypeORM documentation to get started. When you create your `DataSource`, add the following entities:

```typescript
import { ConsumedMessageEntity, DomainEventEntity, SnapshotEntity } from "@dugongjs/typeorm/driver/postgres";
import { DataSource, type DataSourceOptions } from "typeorm";

const dataSourceOptions: DataSourceOptions = {
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "test",
    password: "test",
    database: "test",
    entities: [
        // Your other entities...
        DomainEventEntity,
        SnapshotEntity,
        ConsumedMessageEntity
    ]
};

const dataSource = new DataSource(dataSourceOptions);
```

:::tip
If you wish to use the outbox pattern, also add `OutboxEntity` to the list of entities.
:::
