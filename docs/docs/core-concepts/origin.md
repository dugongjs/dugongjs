---
title: Origin
tags:
    - Core
    - Aggregate
    - Domain event
---

In domain-driven design, **bounded contexts** and **context maps** are essential elements of strategic modelling. A bounded context defines a linguistic boundary within which a specific ubiquitous language is used consistently. Each [aggregate](./aggregates) is owned and managed by a single bounded context and [domain events](./domain-events) for that aggregate should only be emitted from within that context.

In a microservice architecture, each bounded context typically maps to one or more microservices, with every aggregate managed exclusively by a single service.

In DugongJS, the term _origin_ refers to a simple label that identifies a service responsible for managing a given aggregate and its associated domain events. This becomes especially important in systems where a microservice handles both:

- **Internal aggregates**: aggregates it owns and manages directly.
- **External aggregates**: aggregates replicated from other services.

In such cases, the origin value helps uniquely distinguish between aggregates, even when they share the same name. For example, two aggregates from different bounded contexts could have the same type name and persist their events in the same event repository. The origin label ensures these can be distinguished from each other.

The origin can also be associated with a query mechanism that other services can use as a fallback - either to retrieve missing domain events or communicate synchronously when messaging is unavailable. This is particularly useful when a new service is deployed and needs to synchronize its state with existing domain events.

While origin is especially relevant in distributed systems, it also applies to monoliths. In a monolithic architecture, the origin might refer to a bounded context, a specific module, or even a controller responsible for a particular domain. The goal remains the same: to clearly identify where an aggregate and its events are managed.

There are no strict rules for formatting an origin - use whatever naming convention makes sense for your system. For example, if a user aggregate is managed by a user service, the origin might simply be `"UserService"`. In systems that use more explicit strategic modeling, a more descriptive name like `"IAMContext-UserService"` may be appropriate.
