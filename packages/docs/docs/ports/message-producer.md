---
title: Message Producer
sidebar_position: 5
tags:
    - Port
    - Messaging
---

The `IMessageProducer` port defines how [domain events](../core-concepts/domain-events.md) are **published** from DugongJS as [messages](../core-concepts/messages.md) to external systems through a message broker.

### `IMessageProducer`

The responsibility of the `IMessageProducer` is to publish one or more outbound messages based on metadata for a specific aggregate. Methods on the interface will receive the current transaction context provided by [`ITransactionManager`](./transaction-manager.md) which can be used to implement the [outbox pattern](https://microservices.io/patterns/data/transactional-outbox.html), where a dedicated database table functions as an outbox and a transaction log miner acts as the message producer. It should be implemented like so:

```typescript
import type { IMessageProducer } from "@dugongjs/core";

export class MessageProducer implements IMessageProducer<TMessage> {
    // Implementation here...
}
```

Here, `TMessage` should be a type corresponding to the message format of the broker.

### Related Ports

- [`IMessageConsumer`](./message-consumer.md) – listens to inbound messages.
- [`IOutboundMessageMapper`](./message-mappers.md#ioutboundmessagemapper) – maps messages to domain events.
- [`ITransactionManager`](./transaction-manager.md) – used to ensure transactional consistency.
