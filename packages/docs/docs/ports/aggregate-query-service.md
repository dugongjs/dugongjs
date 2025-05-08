---
title: Aggregate Query Service
sidebar_position: 7
tags:
    - Port
---

The `IAggregateQueryService` port defines a query interface for **reading aggregates and their domain events**. It has two primary uses:

- When a microservice needs to fetch domain events for an external aggregate, either as a fallback to a message broker or to bring its own replicated view up to date when domain events have been missed.
- When using the `dugong` CLI.

### `IAggregateQueryService`

The responsibility of the `IAggregateQueryService` is to provide a way to expose queries to the outside world through an API. It is used to facilitate inter process communication (IPC) between microservices. Client classes should implement the `IAggregateQueryService`, while server classes should extend or inject the `AggregateQueryService` class. They may be implemented like so:

```typescript title="aggregate-query-service.client.ts"
import type { IAggregateQueryService } from "@dugongjs/core";

export class AggregateQueryServiceClient implements IAggregateQueryService {
    // Implementation here...
}
```

```typescript title="aggregate-query-service.server.ts"
import { AggregateQueryService } from "@dugongjs/core";

export class AggregateQueryServiceServer extends AggregateQueryService {
    // Implementation here...
}
```
