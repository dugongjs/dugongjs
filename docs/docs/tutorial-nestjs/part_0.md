---
title: "Introduction"
sidebar_position: 1
---

![DugongJS + NestJS](/img/dugongjs_nestjs.png)

In this tutorial, you'll learn how to set up DugongJS within a [NestJS](https://docs.nestjs.com/) application using [TypeORM](https://typeorm.io/) for persistence. We'll walk through a practical example: implementing a very simple **bank account** aggregate. Eventually, we'll also introduce [Kafka](https://kafka.apache.org/documentation/) as a message broker and see how to implement command query responsibility segregation (CQRS).

:::tip
You can find the complete source code for this tutorial in the [official GitHub repository](https://github.com/dugongjs/dugongjs/tree/main/tutorials/nestjs).
:::

The goal of the tutorial is to demonstrate how to:

- Set up a NestJS application with DugongJS.
- Use PostgreSQL and TypeORM with DugongJS adapters.
- Define aggregates, domain events, and commands.
- Set up a project structure with domain and application layers.
- Interacting with an event-sourced aggregate using the DugongJS CLI.

By the end, you'll have a working NestJS application with an event-sourced `BankAccount` aggregate.

:::info
This tutorial assumes you're already familiar with NestJS fundamentals.
:::

:::warning
This tutorial focuses on modeling the domain layer and integrating it with the NestJS application layer using DugongJS. As such, it does not cover essential application concerns like input validation, authentication, or authorization — those are outside the scope of this tutorial. However, this is critical to implement in any actual production application!
:::
