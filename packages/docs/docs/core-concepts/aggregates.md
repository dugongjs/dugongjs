---
title: Aggregates
sidebar_position: 3
tags:
    - Core
    - Aggregate
    - Domain event
---

## Introduction

An **aggregate** is a cluster of domain objects and a fundamental tactical modeling pattern in domain-driven design. To quote Eric Evans:

> Cluster the entities and value objects into "aggregates” and define boundaries around each. Choose one entity to be the “root” of each aggregate, and control all access to the objects inside the boundary through the root. Only allow references to the root to be held by external objects. Transient references to internal members can be passed out for use within a single operation only. Because the root controls access it cannot be blind-sided by changes to the internals. This makes it practical to enforce all invariants for objects in the aggregate and for the aggregate as a whole in any state-change.
>
> <cite>Eric Evans (2004) Domain driven design: Tackling complexity in the heart of software. Addison-Wesley</cite>

Aggregates are the generators and consumers of [domain events](./domain-events.md). They determine the rules for when domain events should be created and what their effect should be on the overall state.

## Defining Aggregates

In an event-sourced system, it is essential to separate the methods that _generate domain events_ (**commands**) from those that _apply domain events to mutate state_ (**event appliers**). This separation is critical because aggregates are reconstructed by replaying their event history from the event log. If state mutation occurs outside of event appliers, that state will be lost during recovery. In this section, we'll explore how DugongJS structures aggregates to support both command handling and event application.

DugongJS provides two abstract base classes for defining aggregates:

- `AbstractAggregateRoot`
- `AbstractEventSourcedAggregateRoot`

`AbstractEventSourcedAggregateRoot` extends `AbstractAggregateRoot`. In most cases, aggregates should derive from `AbstractAggregateRoot`. The lower-level `AbstractEventSourcedAggregateRoot` is primarily useful for advanced use cases like implementing a [shared kernel](../advanced-concepts/shared-kernel.md).

In the domain events documentation, we defined events for a [`BankAccount` aggregate](./domain-events.md#defining-concrete-domain-events). Now, let’s extend that example and define the aggregate itself.

### Aggregate

We begin by defining the `BankAccount` class. It extends the `AbstractAggregateRoot` base class and is decorated with the `@Aggregate("BankAccount")` decorator. The string passed to this decorator must match the `aggregateType` [defined in the domain event base class](./domain-events.md#creating-an-abstract-base-class) (`AbstractBankAccountDomainEvent`).

The aggregate maintains two private properties — `owner` and `balance` — which are exposed via public getters.

```typescript
import { Aggregate, AbstractAggregateRoot } from "@dugongjs/core";

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
}
```

:::note
**What about the aggregate constructor?**

Instead of relying on constructors, aggregates rely on event appliers for state mutation. Aggregates must therefore **never require constructor parameters**! DugongJS needs to be able to call the constructor internally and will always do so without passing any parameters to the constructor. You may define a constructor if you need to initialize certain properties on the aggregate, but this is often redundant. Calling the constructor should always initialize the aggregate into an "empty" state.
:::

### Commands

Next, we define the commands for the aggregate. While domain events represent what has happened (past tense), commands represent what should happen (present tense). They describe valid operations on the aggregate.

Here, we define three commands as TypeScript types, though you could also use interfaces, classes or a schema library:

```typescript
export type OpenAccountCommand = {
    owner: string;
    initialBalance: number;
};

export type DepositMoneyCommand = {
    amount: number;
};

export type WithdrawMoneyCommand = {
    amount: number;
};
```

### Handling Commands

We now implement methods on the aggregate to handle these commands:

```typescript
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

:::tip
The `@CreationProcess()` and `@Process()` decorators are imported from `@dugongjs/core`.
:::

We have now defined four command-handling methods:

- `openAccount(command: OpenAccountCommand): void`
- `depositMoney(command: DepositMoneyCommand): void`
- `withdrawMoney(command: WithdrawMoneyCommand): void`
- `closeAccount(): void`

Note that none of these methods directly mutate the state of the aggregate. Instead, they:

1. Validate the command.
2. Create a domain event using `createDomainEvent()`.
3. Stage the event using `stageDomainEvent()`.

The actual state changes happen later, when the event is applied.

### Domain Event Creation

The `createDomainEvent()` method is used to instantiate domain events within an aggregate. It accepts two parameters:

1. The domain event class (required).
2. A payload (if the event type defines one).

This method performs several tasks:

- If called from a` @CreationProcess()` method and the aggregate does not yet have an ID, an ID will be generated for the aggregate.
- The aggregate ID is set on the domain event.
- A creation timestamp is recorded on the domain event.
- The event’s `onCreate() `lifecycle hook (if implemented) is invoked.

It returns an instance of the domain event ready for staging.

### Domain Event Staging

The `stageDomainEvent()` method queues a domain event to be persisted later during the commit phase. Staging does not immediately apply the event to the aggregate.

When called,` stageDomainEvent()`:

- Adds the event to the aggregate’s list of staged events.
- Sets the event’s sequence number.
- Invokes the onStage() lifecycle hook, if implemented.

Later in the lifecycle, staged events will be committed and applied in order.

### `@Process()` and `@CreationProcess()` decorators

The `@Process()` and `@CreationProcess()` decorators mark methods that represent commands on an aggregate. These decorators are required in order to use `createDomainEvent()` and `stageDomainEvent()` — both of which will throw an error if invoked from a method that is not decorated. This ensures that domain events are only produced through clearly defined command handlers.

The `@CreationProcess()` decorator must be used on the first command that initializes the aggregate (typically something like `openAccount()` or `createUser()`). This signals that a new aggregate instance is being created. It allows the aggregate ID to be generated and assigned automatically if not already present.

Use `@Process()` for all subsequent commands that operate on an existing aggregate instance.

:::tip
An aggregate may have multiple methods decorated with `@CreationProcess()` if there is more than one entrypoint to create the aggregate.
:::

### Applying Domain Events

Commands are used to generate new domain events, but **state mutation happens in _event appliers_**—methods that handle applying those events to the aggregate’s state. Let’s now update the `BankAccount` class to include these event appliers:

```typescript
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

    @Apply(AccountOpenedEvent)
    public applyAccountOpened(event: AccountOpenedEvent): void {
        const payload = event.getPayload();

        this.owner = payload.owner;
        this.balance = payload.initialBalance;
    }

    @Apply(MoneyDepositedEvent)
    public applyMoneyDeposited(event: MoneyDepositedEvent): void {
        const payload = event.getPayload();

        this.balance += payload.amount;
    }

    @Apply(MoneyWithdrawnEvent)
    public applyMoneyWithdrawn(event: MoneyWithdrawnEvent): void {
        const payload = event.getPayload();

        this.balance -= payload.amount;
    }

    @Apply(AccountClosedEvent)
    public applyAccountClosed(): void {
        this.delete();
    }
}
```

:::tip
The `@Apply()`decorator is imported from `@dugongjs/core`.
:::

We have now defined four event-applier methods:

- `applyAccountOpened(event: AccountOpenedEvent): void`
- `applyMoneyDeposited(event: MoneyDepositedEvent): void`
- `applyMoneyWithdrawn(event: MoneyWithdrawnEvent): void`
- `applyAccountClosed(): void`

Each method is decorated with the `@Apply()` decorator, which registers it as the handler for a specific domain event type. This mapping allows DugongJS to apply events to the aggregate instance automatically.

The `applyAccountClosed()` method calls the `delete()` method on the aggregate. This marks the aggregate as deleted, and as a result, any factory method attempting to reconstruct the aggregate from its event log will return `null`. This is useful for signaling that the aggregate should be considered logically removed, even though its events will still remain in the log.

### Construction

There are two ways to construct an aggregate:

1. The first time an aggregate is constructed, call its default constructor and call one of the methods decorated with `@CreationProcess()`:

```typescript
const bankAccount = new BankAccount();

bankAccount.openAccount({ owner: "Bob", initialAmount: 100 });
```

2. Subsequently, use the `AggregateFactory` to build the aggregate from the event log.
