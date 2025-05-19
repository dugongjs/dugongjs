---
title: "Part 13 - Conclusion"
sidebar_position: 14
---

![DugongJS + NestJS](/img/dugongjs_nestjs.png)

In this tutorial, you’ve explored how to integrate event sourcing into a NestJS application using DugongJS. Along the way, you’ve:

- Built a domain layer using aggregates and events.
- Wired up command and query sides using separate models.
- Used different adapters to abstract infrastructure concerns.
- Configured Kafka as an inter-process message broker.
- Discovered the transactional pitfalls of direct event publishing.
- Solved those pitfalls by implementing the outbox pattern with Debezium.

Hopefully, this has demonstrated how DugongJS enables a clear separation of concerns and provides the flexibility to scale infrastructure without compromising domain integrity.
