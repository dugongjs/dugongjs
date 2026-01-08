---
title: Snapshotting
sidebar_position: 1
tags:
    - Aggregate
    - Snapshotting
---

DugongJS reconstructs [aggregates](../core-concepts/aggregates.md) state by loading its [domain events](../core-concepts/domain-events.md) from the domain event repository and applying them in order. As the number of events grows, this rehydration process becomes slower. To mitigate this, DugongJS supports **snapshotting**. This is an optional optimization that allows you to cache and restore aggregate state more efficiently. It is opt-in per aggregate and you may enable it from the start or at a later time if performance should become an issue.

Snapshots are persisted as serialized JSON representations of aggregates and can be used to reduce the number of events that need to be replayed during rehydration.

### Requirements for snapshotting

To support snapshots, an aggregate class must meet certain requirements. A snapshot is just a serialized view of the aggregate, but using native `JSON.stringify()` is not sufficient — class identity and methods are lost during serialization and deserialization. Instead, DugongJS uses the popular [class-transformer](https://github.com/typestack/class-transformer) library to ensure class metadata is preserved and reconstructed correctly.

First, install the dependency:

```bash npm2yarn
npm install class-transformer
```

For simple aggregates (e.g. `BankAccount` with only primitives), no changes are required. You simply mark the class as snapshotable using the `@Snapshotable()` decorator:

```typescript
@Aggregate("BankAccount")
@Snapshotable()
export class BankAccount extends AbstractAggregateRoot {
    private owner: string;
    private balance: number;

    // Rest of the aggregate...
}
```

:::tip
The `@Snapshotable()` decorator is imported from `@dugongjs/core`.
:::

:::info
The default snapshot interval is 10, meaning a snapshot is generated after every 10 events. You can specify this in the decorator: `@Snapshotable({ snapshotInterval: 50 })`
:::

Now let’s consider a slightly more complex example where the `BankAccount` needs to track the latest 12 withdrawals (perhaps to enforce a maximum number of withdrawals in a year). We first create a custom value object to track withdrawals:

```typescript
export class Withdrawal {
    constructor(
        private amount: number,
        private timestamp: Date
    ) {}

    public getAmount(): number {
        return this.amount;
    }

    public getTimestamp(): Date {
        return this.timestamp;
    }
}
```

Here’s how the `BankAccount` might use this value object to enforce a yearly withdrawal limit:

```typescript
@Aggregate("BankAccount")
export class BankAccount extends AbstractAggregateRoot {
    private withdrawals: Withdrawal[] = [];

    @Process()
    public withdrawMoney(command: WithdrawMoneyCommand): void {
        if (command.amount <= 0) {
            throw new Error("Withdraw amount must be greater than zero");
        }

        if (this.balance < command.amount) {
            throw new Error("Insufficient funds");
        }

        const now = new Date();
        const withdrawalsThisYear = this.withdrawals.filter(
            (w) => w.getTimestamp().getFullYear() === now.getFullYear()
        );

        if (withdrawalsThisYear.length >= 12) {
            throw new Error("Withdrawal limit for the year exceeded (12)");
        }

        const event = this.createDomainEvent(MoneyWithdrawnEvent, {
            amount: command.amount
        });

        this.stageDomainEvent(event);
    }

    @Apply(MoneyWithdrawnEvent)
    public applyMoneyWithdrawn(event: MoneyWithdrawnEvent): void {
        const { amount } = event.getPayload();
        const timestamp = event.getTimestamp();

        this.balance -= amount;

        this.withdrawals.push(new Withdrawal(amount, timestamp));

        if (this.withdrawals.length > 12) {
            this.withdrawals = this.withdrawals.slice(-12);
        }
    }

    // Rest of the aggregate...
}
```

This works at runtime, but it won’t deserialize correctly from a snapshot. The `Withdrawal` instances will be converted into plain objects, and calling methods like `getTimestamp()` will result in an error.

To fix this, we need to instruct class-transformer to handle the `Withdrawal` array properly. We add the `@Type()` decorator to tell class-transformer how to reconstruct the objects during deserialization:

```typescript
@Aggregate("BankAccount")
@Snapshotable()
export class BankAccount extends AbstractAggregateRoot {
    private owner: string;
    private balance: number;

    @Type(() => Withdrawal)
    private withdrawals: Withdrawal[] = [];

    // Rest of the aggregate...
}
```

:::tip
The `@Type()` decorator is imported from `class-transformer`.
:::

By marking the array with `@Type(() => Withdrawal)`, DugongJS can take a JSON snapshot and reliably rehydrate it back into proper `Withdrawal` instances—with methods and class identity intact.

:::note
If you experience any issues with snapshotting, be sure to check out the documentation for `class-transformer`. It is likely caused by missing or incorrect use of decorators.
:::
