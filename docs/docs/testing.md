---
title: "Testing"
sidebar_position: 1
---

Testing with DugongJS is similar to testing any other application. However, there are a few nuances worth mentioning.

The `@dugongjs/testing` package provides some utility functions to make testing easier. The following documentation covers common testing guidelines for DugongJS.

## Installation

Install the testing package:

```bash npm2yarn
npm install @dugongjs/testing
```

## Testing aggregates

Aggregates are ideal targets for testing. They enforce invariants, execute domain logic and act as consistency boundaries for the system. These are all things you should care about and cover with automated tests. Thankfully, aggregates are also extremely testable, as they typically have no dependencies to the outside world. Tests can therefore be written without excessive mocking and give a high level of confidence.

In an event-sourced system, the main things to test are:

1. When commands execute, they stage domain events or throw an error.
2. When events are applied, they correctly update the aggregate state.

### Testing commands

When testing commands, you verify that calling a command either:

1. Stages the expected domain events
2. Throws an error when invariants are violated

The `@dugongjs/testing` package provides a set of assertion functions that help you write tests. These functions are not coupled to any specific test runner, such as Jest or Vitest. Instead, they assert that an aggregate has the expected staged domain events. If an assertion fails, an error is thrown, which causes the test to fail. Events returned from assertion functions are also automatically typed to the corresponding event class.

The following example shows how we can write tests for the [bank account aggregate](./core-concepts/aggregates.md#commands), using Vitest as the test runner:

```typescript
import { describe, expect, it } from "vitest";
import {
    assertStagedEvent,
    assertSingleStagedEvent,
    assertStagedEventCount,
    assertNoStagedEvents
} from "@dugongjs/testing";
import { BankAccount } from "./bank-account.aggregate";
import { AccountOpenedEvent, MoneyDepositedEvent } from "./bank-account.events";

describe("BankAccount commands", () => {
    describe("openAccount", () => {
        it("should stage AccountOpenedEvent when opening an account", () => {
            // Create an account
            const bankAccount = new BankAccount();
            bankAccount.openAccount({
                owner: "Alice",
                initialBalance: 1000
            });

            // Assert AccountOpenedEvent was staged
            const event = assertSingleStagedEvent(bankAccount, AccountOpenedEvent);

            // Validate the event payload
            expect(event.getPayload()).toMatchObject({
                owner: "Alice",
                initialBalance: 1000
            });
        });
    });

    describe("depositMoney", () => {
        it("should stage MoneyDepositedEvent when depositing valid amount", () => {
            // Create an account
            const bankAccount = new BankAccount();
            bankAccount.openAccount({ owner: "Alice", initialBalance: 1000 });

            // Deposit money
            bankAccount.depositMoney({ amount: 500 });

            // Assert MoneyDepositedEvent was staged
            const depositedEvent = assertStagedEvent(bankAccount, MoneyDepositedEvent);

            // Validate the event payload
            expect(depositedEvent.getPayload()).toMatchObject({
                amount: 500
            });
        });

        it("should throw when depositing non-positive amount", () => {
            // Create an account
            const bankAccount = new BankAccount();
            bankAccount.openAccount({ owner: "Alice", initialBalance: 1000 });

            // Deposit negative amount and expect error
            expect(() => bankAccount.depositMoney({ amount: -100 })).toThrow(
                "Deposit amount must be greater than zero"
            );
        });

        it("should have no staged events when command fails", () => {
            // Create an account
            const bankAccount = new BankAccount();
            bankAccount.openAccount({ owner: "Alice", initialBalance: 1000 });

            try {
                bankAccount.depositMoney({ amount: -100 });
            } catch {
                // Expected error
            }

            assertNoStagedEvents(bankAccount);
        });
    });

    describe("withdrawMoney", () => {
        it("should throw when withdrawing more than available balance", () => {
            // Create an account
            const bankAccount = new BankAccount();
            bankAccount.openAccount({ owner: "Alice", initialBalance: 500 });

            // Withdraw excessive amount, expect error
            expect(() => bankAccount.withdrawMoney({ amount: 1000 })).toThrow("Insufficient funds");
        });
    });
});
```

#### Available assertion helpers

- `assertStagedEvent(aggregate, EventClass)` — Asserts at least one matching event exists and returns the first one
- `assertSingleStagedEvent(aggregate, EventClass)` — Strictly asserts exactly one matching event exists and returns it
- `assertStagedEventCount(aggregate, count)` — Asserts the aggregate has exactly the specified number of staged events
- `assertNoStagedEvents(aggregate)` — Asserts the aggregate has no staged events

If an assertion fails, it throws a descriptive error message that clearly identifies what was expected and what was found.

### Testing event appliers

Event appliers must correctly update the aggregate's state when events are applied. You test these by creating an event, applying it to the aggregate, and then verifying that the aggregate state has been updated correctly.

When an event applier is tested properly, you ensure that event replay—the process of reconstructing an aggregate from its event history—works correctly.

Here's how to test event appliers for the `BankAccount` aggregate:

```typescript
describe("BankAccount event appliers", () => {
    describe("applyAccountOpened", () => {
        it("should set owner and balance when AccountOpenedEvent is applied", () => {
            // Create an account
            const bankAccount = new BankAccount();

            // Generate creation event
            const accountId = faker.string.uuid();
            const event = new AccountOpenedEvent(accountId, {
                owner: "Alice",
                initialBalance: 1000
            });

            // Apply the creation event
            bankAccount.applyAccountOpened(event);

            // Validate owner and balance
            expect(bankAccount.getOwner()).toBe("Alice");
            expect(bankAccount.getBalance()).toBe(1000);
        });
    });

    describe("applyMoneyDeposited", () => {
        it("should increase balance when MoneyDepositedEvent is applied", () => {
            // Create an account
            const bankAccount = new BankAccount();

            // Generate creation event
            const accountId = faker.string.uuid();
            const openEvent = new AccountOpenedEvent(accountId, {
                owner: "Alice",
                initialBalance: 1000
            });

            // Apply the creation event
            bankAccount.applyAccountOpened(openEvent);

            // Create a deposit event
            const depositEvent = new MoneyDepositedEvent(accountId, {
                amount: 500
            });

            // Apply the deposit event
            bankAccount.applyMoneyDeposited(depositEvent);

            // Validate new balance
            expect(bankAccount.getBalance()).toBe(1500);
        });
    });

    describe("applyMoneyWithdrawn", () => {
        it("should decrease balance when MoneyWithdrawnEvent is applied", () => {
            // Create an account
            const bankAccount = new BankAccount();

            // Generate creation event
            const accountId = faker.string.uuid();
            const openEvent = new AccountOpenedEvent(accountId, {
                owner: "Alice",
                initialBalance: 1000
            });

            // Apply the creation event
            bankAccount.applyAccountOpened(openEvent);

            // Generate a withdraw event
            const withdrawEvent = new MoneyWithdrawnEvent(accountId, {
                amount: 250
            });

            // Apply the withdraw event
            bankAccount.applyMoneyWithdrawn(withdrawEvent);

            // Validate new balance
            expect(bankAccount.getBalance()).toBe(750);
        });
    });
});
```

:::tip
When testing event appliers, focus on verifying that state updates correctly. It is not the event applier's responsibility to maintain consistency, as that is handled by command methods.
:::

:::tip
Sometimes when testing event appliers, you may need to apply a few different events first, to get the aggregate into a valid state. In this example, we applied an `AccountOpenedEvent` before applying the `MoneyDepositedEvent` or `MoneyWithdrawnEvent`.
:::

### Testing snapshots

If an aggregate is [snapshotable](./advanced-concepts/snapshotting.md), it is recommended to test that snapshotting and snapshot recovery works as expected.

After a snapshot is taken, DugongJS always checks that snapshot recovery is possible before persisting the snapshot, to avoid leaving the aggregate in an unrecoverable state. The same internal check, which is accessible through the `aggregateSnapshotTransformer` singleton, can be used for testing:

```typescript
// other imports...
import { aggregateSnapshotTransformer } from "@dugongjs/core";

describe("Snapshotting", () => {
    it("should be snapshotable", () => {
        // Create an account
        const bankAccount = new BankAccount();

        // Generate creation event
        const accountId = faker.string.uuid();
        const openEvent = new AccountOpenedEvent(accountId, {
            owner: "Alice",
            initialBalance: 1000
        });

        // Apply the creation event
        bankAccount.applyAccountOpened(openEvent);

        // Verify snapshot recovery
        const result = aggregateSnapshotTransformer.canBeRestoredFromSnapshot(BankAccount, bankAccount);
        expect(result.isEqual).toBe(true);
    });
});
```

:::tip
Before testing snapshot recovery, ensure that the aggregate is in a meaningful state. When testing complex aggregates with multiple value objects and entities, you may need to apply multiple events to the aggregate before calling `canBeRestoredFromSnapshot()`. In the ["Requirements for snapshotting" example](./advanced-concepts/snapshotting.md), this test might produce a false positive if at least one withdrawal event was not applied before calling `canBeRestoredFromSnapshot()`.
:::
