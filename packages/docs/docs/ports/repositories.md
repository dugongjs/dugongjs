---
title: Repositories
sidebar_position: 2
tags:
    - Port
    - Persistence
    - Snapshotting
---

DugongJS defines three repository ports that must be implemented to support persistence and event sourcing:

1. `IDomainEventRepository` – stores and retrieves domain events.
2. `ISnapshotRepository` – stores and loads aggregate snapshots.
3. `IConsumedMessageRepository` – tracks processed external messages to ensure idempotency.

These interfaces represent **persistence ports** in the ports-and-adapters architecture. DugongJS expects your application to provide concrete **adapters** for these ports, whether backed by a database, file system, in-memory storage, external API, or any other infrastructure.

### `IDomainEventRepository`

The responsibility of the `IDomainEventRepository` is to persist and load domain events for aggregates. It should be implemented like so:

```typescript
import type { IDomainEventRepository } from "@dugongjs/core";

export class DomainEventRepository implements IDomainEventRepository {
    // Implementation here...
}
```

### `ISnapshotRepository`

The responsibility of the `ISnapshotRepository` is to persist and load snapshots for aggregates. The implementing adapter may choose how many snapshots to keep and what to do with old snapshots when a new one is captured. DugongJS generally only cares about the latest snapshot. It should be implemented like so:

```typescript
import type { ISnapshotRepository } from "@dugongjs/core";

export class SnapshotRepository implements ISnapshotRepository {
    // Implementation here...
}
```

### `IConsumedMessageRepository`

The responsibility of the `IConsumedMessageRepository` is to persist the domain event ID and consumer ID of consumed messages, as well as to check if messages have already been consumed. This is needed to ensure idempotency in message consumers. It should be implemented like so:

```typescript
import type { IConsumedMessageRepository } from "@dugongjs/core";

export class ConsumedMessageRepository implements IConsumedMessageRepository {
    // Implementation here...
}
```

### Related Ports

- [`ITransactionManager`](./transaction-manager.md) – coordinates repository operations within a transaction.
- [`IAggregateQueryService`](./aggregate-query-service.md) – used to query aggregates and domain events.
