---
title: Introduction
sidebar_position: 1
tags:
    - Port
---

DugongJS is built on the **ports-and-adapters architecture**, also known as the **hexagonal architecture**. This design pattern promotes a clean separation between the core business logic and the surrounding infrastructure.

The core package (`@dugongjs/core`) contains pure domain logic and has zero knowledge of how the application is wired or what infrastructure it runs on. It achieves this isolation by interacting with the outside world exclusively through **ports** — interfaces that define expected behaviors without binding to specific implementations.

This approach is highly flexible and makes the system easy to extend, test, and integrate. For example, one of the ports used in DugongJS is `ISnapshotRepository`, which defines the contract for reading and writing snapshots. The core module does not care whether this contract is fulfilled by a database, the filesystem, localStorage, or even an external API. It simply expects that an adapter will be available to implement the port.

Fortunately, you typically don’t need to implement these adapters yourself — DugongJS provides a set of built-in adapters for common use cases. However, you have the flexibility to create custom implementations if needed. See the adapter documentation for a list of supported adapters and guidance on how to provide your own.
