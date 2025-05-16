---
title: Introduction
sidebar_position: 1
---

Many popular Node.js backend frameworks - such as Express and NestJS - excel at handling networking, request life-cycle management, and other infrastructure-level concerns. However, they often fall short when it comes to guiding developers in structuring complex business logic. Concepts central to domain-driven design (DDD), such as aggregates, domain events, entities and value objects, are left entirely up to the developer to implement. This limitation becomes especially apparent in the world of microservices, where DDD is often the foundational approach.

DugongJS aims to bridge this gap by providing an event sourcing framework to the Node.js ecosystem. It is built on the ports-and-adapters (hexagonal) architecture, making its core components completely framework- and infrastructure agnostic. As a result, it can be integrated with popular frameworks and infrastructure tools simply by implementing suitable adapters.

## Limitations With Traditional Persistence

Backend services traditionally persist data in relational databases, where each resource corresponds to a table row. When resources are created, updated or deleted, the corresponding row is inserted, modified or removed. This model is straightforward and works well for many use cases. However, it also introduces various shortcomings, especially in systems that deal with complex business processes or need traceability:

- **Limited audit trail**: Without explicit mechanisms for logging, only the current state of an entity is stored. Historical changes are lost unless extra audit infrastructure is added. Even when updates are tracked via the database or change data capture (CDC) tools, the tracking is mechanistic - it does not necessarily reflect meaningful domain behavior.
- **Impedance mismatch with domain modelling**: Mapping rich domain behavior to CRUD operations often leads to anemic models and scattered business rules.
- **Limited support for temporal queries**: Answering questions like _what did this order look like last week?_ or _why did this change occur?_ requires custom versioning schemes or change tracking tables.
- **Concurrency concerns**: Handling race conditions or complex invariants with traditional locking or optimistic concurrency can be challenging and may require custom logic per database table.

## Event Sourcing

Event sourcing offers a fundamentally different approach to persistence. Rather than storing only the current state of the entity, it captures every single state change as a discrete unit (a _domain event_), preserving the full history of the system's behavior. The current state is no longer a static record stored in a table, but rather the result of passing a sequence of past events through an _aggregate_ to compute the latest available outcome. Event sourcing aligns well with DDD by allowing developers to focus on domain behaviors and business rules rather than the mechanics of state persistence or database schema design.

:::info
Note that one does not necessarily exclude the other! One fundamental limitation of event sourcing is limited query capabilities. However, by utilizing event sourcing for _writes_ (commands) and traditional persistence for _reads_ (queries), we can combine the best of both worlds. This is the principle of command query responsibility segregation (CQRS). More on that later!
:::
