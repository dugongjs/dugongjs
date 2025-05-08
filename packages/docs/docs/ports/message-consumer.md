---
title: Message Consumer
sidebar_position: 4
tags:
    - Port
    - Messaging
---

The `IMessageConsumer` port defines how DugongJS receives [domain events](../core-concepts/domain-events.md) as [messages](../core-concepts/messages.md) from external systems via a message broker. It is part of the asynchronous integration mechanism that supports event-driven microservice communication.

### `IMessageConsumer`

The responsibility of the `IMessageConsumer` is to register a message consumer based on metadata for a specific aggregate and invoke a handler when the message is received from the broker. It should be implemented like so:

```typescript
import type { IMessageConsumer } from "@dugongjs/core";

export class MessageConsumer implements IMessageConsumer<TMessage> {
    // Implementation here...
}
```

Here, `TMessage` should be a type corresponding to the message format of the broker.

### Related Ports

- [`IMessageProducer`](./message-producer.md) – sends outbound messages.
- [`IMessageSerdes`](./message-serdes.md) – serializes/deserializes domain events in transit.
