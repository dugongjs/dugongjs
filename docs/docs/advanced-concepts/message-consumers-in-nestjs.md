---
title: Message Consumers in NestJS
sidebar_position: 4
tags:
    - Messaging
    - NestJS
    - Aggregate
    - Domain event
---

NestJS provides a declarative, decorator-based approach to request routing. When using DugongJS with NestJS, you can use a similar approach to define message consumers that handle specific domain events using a declarative syntax.

:::note
This feature is only available when using DugongJS with NestJS.
:::

## Prerequisites

To enable this feature, import the `AggregateDomainEventConsumerModule` from `@dugongjs/nestjs` and include it in your NestJS module imports:

```typescript showLineNumbers
import { AggregateDomainEventConsumerModule } from "@dugongjs/nestjs";
import { Module } from "@nestjs/common";

@Module({
    imports: [
        // Other imports...
        AggregateDomainEventConsumerModule
    ]
})
export class AppModule {}
```

## Defining Message Consumers

Define a message consumer as you would a regular NestJS controller, using the `@Controller()` decorator. To specify that the controller is a domain event consumer for a specific aggregate, use the `@AggregateDomainEventConsumer()` decorator, passing in the aggregate class and a consumer name. The consumer name is used to uniquely identify the consumer in the message broker and when marking messages as consumed. Make it a descriptive name that reflects its purpose.

```typescript
import { AggregateDomainEventConsumer } from "@dugongjs/nestjs";
import { Controller } from "@nestjs/common";
import { BankAccount } from "../../domain/bank-account.aggregate.js";

@Controller()
@AggregateDomainEventConsumer(BankAccount, "MyConsumerName")
export class MyBankAccountConsumerController {
    // Message handling methods go here...
}
```

To create handler for specific domain events, use the `@OnDomainEvent()` decorator on methods within the controller. Each method should accept a single parameter of type `HandleMessageContext<TDomainEvent>`, where `TDomainEvent` is the type of domain event being handled. The `HandleMessageContext` provides access to the the following properties:

- `domainEvent`: The domain event instance being handled.
- `transactionContext`: The transaction context for the current message handling operation. This is the same context that is used to mark the message as consumed and persist the domain event if it came from an external origin.
- `message`: The raw message received from the message broker.

The following example builds on the [NestJS tutorial](../tutorial-nestjs/part_0.md) and demonstrates how to create a domain event consumer that logs various domain events related to the `BankAccount` aggregate:

```typescript
import type { HandleMessageContext } from "@dugongjs/core";
import { AggregateDomainEventConsumer, OnDomainEvent } from "@dugongjs/nestjs";
import { Controller, Inject, Logger } from "@nestjs/common";
import { BankAccount } from "../../domain/bank-account.aggregate.js";
import { AccountOpenedEvent } from "../../domain/domain-events/account-opened.event.js";
import { AccountClosedEvent } from "../../domain/domain-events/account-closed.event.js";
import { MoneyDepositedEvent } from "../../domain/domain-events/money-deposited.event.js";
import { MoneyWithdrawnEvent } from "../../domain/domain-events/money-withdrawn.event.js";

@Controller()
@AggregateDomainEventConsumer(BankAccount, "LoggingConsumer")
export class BankAccountLoggingConsumerController {
    private readonly logger = new Logger(BankAccountLoggingConsumerController.name);

    @OnDomainEvent(AccountOpenedEvent)
    public onAccountOpened(ctx: HandleMessageContext<AccountOpenedEvent>): void {
        this.logger.log(
            `BankAccount with ID ${ctx.domainEvent.getAggregateId()} was opened with payload:`,
            ctx.domainEvent.getPayload()
        );
    }

    @OnDomainEvent(AccountClosedEvent)
    public onAccountClosed(ctx: HandleMessageContext<AccountClosedEvent>): void {
        this.logger.log(
            `BankAccount with ID ${ctx.domainEvent.getAggregateId()} was closed with payload:`,
            ctx.domainEvent.getPayload()
        );
    }

    @OnDomainEvent(MoneyDepositedEvent)
    public onMoneyDeposited(ctx: HandleMessageContext<MoneyDepositedEvent>): void {
        this.logger.log(
            `Money deposited to BankAccount with ID ${ctx.domainEvent.getAggregateId()}:`,
            ctx.domainEvent.getPayload()
        );
    }

    @OnDomainEvent(MoneyWithdrawnEvent)
    public onMoneyWithdrawn(ctx: HandleMessageContext<MoneyWithdrawnEvent>): void {
        this.logger.log(
            `Money withdrawn from BankAccount with ID ${ctx.domainEvent.getAggregateId()}:`,
            ctx.domainEvent.getPayload()
        );
    }

    // You can also create a single handler for multiple event types
    @OnDomainEvent(AccountOpenedEvent)
    @OnDomainEvent(AccountClosedEvent)
    @OnDomainEvent(MoneyDepositedEvent)
    @OnDomainEvent(MoneyWithdrawnEvent)
    public onAnyEvent(
        ctx: HandleMessageContext<AccountOpenedEvent | AccountClosedEvent | MoneyDepositedEvent | MoneyWithdrawnEvent>
    ): void {
        this.logger.log(
            `Received domain event of type ${ctx.domainEvent.getType()} for BankAccount with ID ${ctx.domainEvent.getAggregateId()}`
        );
    }
}
```

:::tip
While the example above demonstrates simple logging, you can implement complex, asynchronous logic inside the message consumer methods. For instance, by injecting the `EventSourcingService`, you can load other aggregates and perform operations based on the received domain events. This is useful when you need to replicate state across aggregates/bounded contexts or trigger side effects in response to domain events.

You could also use it to send emails, Slack notifications, or integrate with other external systems.
:::
