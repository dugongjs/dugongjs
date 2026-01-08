---
title: TypeORM
sidebar_position: 1
---

The `@dugongjs/typeorm` package provides adapter implementations for [TypeORM](https://typeorm.io/).

It has adapters for the following ports:

| Port                                                                                | Adapter                            |
| ----------------------------------------------------------------------------------- | ---------------------------------- |
| [`IDomainRepository`](../ports/repositories.md#idomaineventrepository)              | `DomainRepositoryTypeOrm`          |
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

### Configuring `DataSource`

Follow the TypeORM documentation to get started. When you create your `DataSource`, add the following entities:

```typescript
import { ConsumedMessageEntity, DomainEventEntity, SnapshotEntity } from "@dugongjs/typeorm";
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
