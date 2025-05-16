---
title: Transaction Manager
sidebar_position: 3
tags:
    - Port
    - Persistence
---

The `ITransactionManager` port provides a way to coordinate **persistence operations** across multiple repositories in a transactional context. This ensures that domain events, snapshots, and metadata changes are committed atomically.

### `ITransactionManager`

The responsibility of the `ITransactionManager` is to set up a transactional context for persistence. It must provide a `transaction` method that ensures transactionality of all [repository](./repositories.md) operations performed within it. If an unhandled error is thrown within the `transaction` method, the transaction must be rolled back. If the `transaction` method returns without throwing, the transaction must be committed.

It should be implemented like so:

```typescript
import type { ITransactionManager, RunInTransaction } from "@dugongjs/core";

export class TransactionManager implements ITransactionManager {
    public async transaction<TResult = unknown>(runInTransaction: RunInTransaction<TResult>): Promise<TResult> {
        // Implementation here...
    }
}
```
