---
title: Introduction
sidebar_position: 1
---

## About DugongJS

DugongJS is a library designed to simplify the implementation of event sourcing in server-side TypeScript applications. The `@dugongjs/core` package provides essential tools for expressing domain logic and has no direct dependencies on infrastructure elements such as databases or message brokers. This makes it very flexible to use in a range of environments. Additional packages are available to provide integrations and adapters for some common technologies like [NestJS](https://nestjs.com/), [TypeORM](https://typeorm.io/) and [Kafka](https://kafka.apache.org/).

## What is event sourcing?

Event sourcing is relatively simple to understand. Instead of persisting the state of your system directly using tables and relations, you store a list of facts in the order they occurred and use that list to derive the current state of the system when you need it.

The architecture revolves around _domain events_, simple facts that carry significance within the domain. Once an event has occurred, it becomes part of your system's history. In event sourcing, by design, we do not delete or modify events. They are immutable records of the past and we keep them for as long as the system requires. If you wish to update an entity, you emit an "updated" event. If you wish to delete it, you emit a "deleted" event (note that domain events should follow the language of the domain and CRUD-like events like these should be an exception, but it illustrates the concept well).

While event sourcing is straightforward to understand conceptually, its implementation comes with a few pitfalls. DugongJS is designed to help navigate these pitfalls and make the adoption of event sourcing practical and ergonomic.

## Why use event sourcing?

Event sourcing comes with many benefits:

#### Event history

The most obvious benefit of event sourcing is that it introduces the dimension of time to the system. Using traditional persistence allows you to keep track of the current state, but you don't necessarily know how the state was reached. Knowing the full history of the system comes with both technical benefits and real business advantages. It gives you a complete audit trail of every entity in the system. It also allows you to time travel to an earlier state by simply moving the cursor backwards in the event log. If you wish to know when an order was placed, and by whom, or why an order was rejected or accepted, or why the payment didn't go through, it's all there in the event log. In many domains, this level of traceability is a fundamental requirement. In banking, for example, your balance is always a computation over your transaction history (imagine a banking service that couldn't tell you where your money went!).

#### Event modelling

One of the most common points of friction between developers and business experts lies in the very language they use to communicate. Business experts use the natural language of the domain. It's the language they use in their daily work and it's how they communicate with other business experts. The real problems that need solving - why they needed software to begin with - are formulated in this language. Business experts mainly operate in _problem space_.

Developers, however, are trained to think in the details of the implementations, such as database schemas, API design, classes, inheritance and so on. They tend to jump too quickly to technical solutions without fully understanding or exploring the problem space. They mainly operate in _solution space_.

While the business experts tend to have the right ideas with regards to the domain, they often lack the conceptual rigor required by software development. If the language used by the domain experts and developers is misaligned and requires frequent translation, it may lead to contention that brings down the entire development effort, or a significant degradation of the outcome.

By leveraging _event modelling_, however, domain experts and developers are forced to gather around a central concept that everyone can understand and reason about. Modelling the domain in terms of events is more natural for the business experts, once they are taught how to do it, and events map cleanly from problem space to solution space. By leveraging event sourcing, developers can readily implement models formulated during collaborative sessions without needing much translation.

Event modelling fits perfectly with another modelling paradigm, namely Domain-Driven Design (DDD). If you are looking to implement event sourcing, it is very likely that you have already discovered DDD and may have some familiarity with it. Domain events are essential tactical design elements in DDD and event sourcing is typically based on DDD principles. DugongJS is no different. If you explore the API, you will find frequent references to tactical DDD elements including domain events, value objects, aggregates and repositories, as well as strategic elements like bounded contexts and context maps. You can read more about DDD further down.

#### Event-driven architecture

While event sourcing and event-driven architecture are not exactly the same, they are highly compatible. Event sourcing is mainly a persistence model, whereas event-driven architecture is about using events for communication. When using event sourcing, however, events are already central elements and extending the architecture to be event-driven is mainly a matter of emitting events to a message broker or internal memory bus.

Event-driven architecture is powerful because it allows services to react to events without introducing significant coupling. A service can set up an event listener that reacts to a specific event to carry out an operation, such as updating a query model, sending an email notification or triggering a computation, completely independently of the mechanism that generated the event. In a microservice architecture, the events produced by Service A can be consumed by Service B without introducing temporal coupling between the services. Service B does not even need to know that Service A exists!

## Why not to use event sourcing?

While the benefits of event sourcing are many, there are also some drawbacks:

#### Organizational challenges

While not limited to event sourcing alone, any development effort that requires ambitious domain modelling can face organizational challenges. Developers alone cannot build software in complex domains, but must rely on domain experts to provide the necessary domain knowledge (the exception is of course when the domain is _software_ itself, but this is an edge case). This requires access to domain experts and a willingness to engage in collaborative sessions in an established format, such as event modelling or DDD.

Therefore, before delving into event sourcing, make sure your organization is behind you! Event sourcing as a purely technical solution has limited value.

#### Eventual consistency

One of the main drawbacks of event sourcing is that an event log is not an effective medium for queries. If a service needs to query aggregates based on a set of given criteria, as most applications typically need, the event log does not directly provide a means of doing that. You cannot search, order and filter results based on the event log alone. The common solution to this problem is _command query responsibility segregation_ (CQRS). In CQRS, we separate _write_ operations (commands) from _read_ operations (queries). Commands are issued against event-sourced aggregates that generate domain events. A separate query process reads these domain events and generates its own query-optimized data store. Queries are then carried out against this other data store. The command and query processes can be part of the same service or can in some cases be divided into two separate microservices. This is sometimes done to allow independent scaling of the two sides (for example in an application where data writes happen rarely but reads happen frequently or vice versa).

While CQRS solves the query problem, it also introduces the problem of _eventual consistency_. Since the query side is updated asynchronously based on the events generated by the command side, there is an arbitrary time lag between when a command is processed and when the corresponding data is available for querying. This typically shifts some of the complexity to client applications, because they cannot immediately query data after issuing a command.

#### Verbosity

When you use event sourcing, you introduce multiple extra layers that would not be there in a simpler CRUD-style application. This includes:

- Domain events
- Aggregates
- Value objects
- Entities
- Commands
- Query models
- Repositories
- And others...

Some of these are not directly related to event sourcing and might be part of your codebase regardless, especially if you are working in a non-trivial domain and actively engaged in DDD.

While added verbosity can be seen as a downside, it is rarely a deciding factor. You should instead consider whether your domain (or specific use-case) is simply too trivial for event sourcing to add any real value. Most domains are not.

Besides, at the time of writing, coding agents can usually do a decent job of handling some of this verbosity once clear patterns have been established in the codebase. When instructed properly, tools like [Claude Code](https://code.claude.com/docs/en/overview) can quickly scaffold the necessary boilerplate code, but be cautious of letting LLMs implement your domain logic as this is often where they produce the weakest results!

## Why event sourcing with TypeScript?

In recent years, thanks to the advent of JavaScript server-side runtimes like [Node.js](https://nodejs.org/en), [Deno](https://deno.com/) and [Bun](https://bun.com/), JavaScript and especially TypeScript have become popular languages for backend development. Several frameworks have emerged in the ecosystem to facilitate backend development, including [Express](https://expressjs.com/) and [NestJS](https://nestjs.com/), and they have seen widespread adoption. But while they provide excellent support for application- and infrastructure-level concerns, there is seemingly a gap between what these frameworks offer and what is required by modern development architectures like event sourcing.

When development of DugongJS began, there appeared to be no actively maintained event sourcing frameworks for Node.js. Since then, [Ocoda Event Sourcing](https://ocoda.github.io/event-sourcing) has gained traction and seems to be built on many of the same ideas as DugongJS, except that it is built directly on top of NestJS, where in contrast `@dugongjs/core` is completely independent from NestJS. DugongJS is built using hexagonal architecture and is therefore framework- and infrastructure-agnostic. The main goal of DugongJS is to integrate with existing frameworks, not to replace them. The core package is meant to be used to build domain logic. Other packages are available to provide easy integration with existing frameworks and infrastructure.

## What about Domain-Driven Design (DDD)?

DDD is a well-established and very powerful methodology for building complex software systems, emphasizing the importance of modeling the domain accurately and aligning the software design with real-world business processes. It is mainly divided into two areas: _strategic design_, which focuses on the high-level understanding of the domain and relationships between different domains, and _tactical design_, which deals with lower-level elements like domain events, entities and aggregates.

Both tactical and strategic design are essential when building complex systems. Teams only focusing on the tactical design are said to be doing "DDD lite". A common modelling pitfall is to spend too little time on strategic design. This is usually an indication that the problem space has not been sufficiently explored.

Despite what you might be thinking after reading this far, event sourcing does **not** mean keeping one long ever-growing event log for the whole system. That would be extremely impractical and introduce issues with scaling, partitioning, locking, replaying events in order and enforcing consistency boundaries. Instead, we use _event streams_. An event stream represents a chronological list of events for **one specific business entity**. This means that every instance of a user, order, or inventory item (or whatever entities exist in your domain) have their own event logs.

In DDD terms, event streams align extremely well with _aggregates_. An aggregate is a cluster of domain objects that can be treated as a single unit and enforces its own consistency boundary. In the context of event sourcing, aggregates are entities that generate domain events through _commands_ and their state is in turn determined by the domain events in their event log.

DugongJS is built on DDD principles and assumes at least some familiarity with it. If you wish to learn more about DDD, take a look at the [recommended reading](../learning-materials/recommended-reading.mdx).
