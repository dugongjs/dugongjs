---
title: Message Mappers
sidebar_position: 6
tags:
    - Port
    - Messaging
---

DugongJS defines two message mapper ports that must be implemented when producing and consuming [messages](../core-concepts/messages.md) containing [domain events](../core-concepts/domain-events.md):

1. `IInboundMessageMapper` - maps messages containing domain events to domain events.
2. `IOutboundMessageMapper` - maps domain events to messages.

By separating the inbound and outbound mappings, asymmetric message producing/consumption can be realized.

### `IInboundMessageMapper`

The responsibility of `IInboundMessageMapper` is to map messages coming from a message broker into domain events. It should be implemented like so:

```typescript
import type { IInboundMessageMapper } from "@dugongjs/core";

export class InboundMessageMapper implements IInboundMessageMapper<TMessage> {
    // Implementation here...
}
```

Here, `TMessage` is the inbound message format.

### `IOutboundMessageMapper`

The responsibility of `IOutboundMessageMapper` is to map domain events to messages to prepare them for transit through a message broker. It should be implemented like so:

```typescript
import type { IOutboundMessageMapper } from "@dugongjs/core";

export class InboundMessageMapper implements IOutboundMessageMapper<TMessage> {
    // Implementation here...
}
```

Here, `TMessage` is the outbound message format.

### Related Ports

- [`IMessageProducer`](./message-producer.md)
- [`IMessageConsumer`](./message-consumer.md)
