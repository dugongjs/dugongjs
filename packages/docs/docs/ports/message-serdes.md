---
title: Message Serdes
sidebar_position: 6
tags:
    - Port
    - Messaging
---

The `IMessageSerdes` port defines how [domain events](../core-concepts/domain-events.md) are **serialized and deserialized** to and from [messages](../core-concepts/messages.md) as they pass through a message broker.

### `IMessageSerdes`

The responsibility of `IMessageSerdes` is to serialize domain events into messages for transmission through a message broker and to deserialize messages back into domain events. It should be implemented like so:

```typescript
import type { IMessageSerdes } from "@dugongjs/core";

export class MessageSerdes implements IMessageSerdes<TMessageIn, TMessageOut> {
    // Implementation here...
}
```

Here, `TMessageIn` and `TMessageOut` should be types corresponding to the message format for incoming messages and outgoing messages of the broker respectively. If the message format is the same for incoming and outgoing messages, a single type parameter can be used.

### Related Ports

- [`IMessageProducer`](./message-producer.md)
- [`IMessageConsumer`](./message-consumer.md)
