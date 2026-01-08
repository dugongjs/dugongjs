---
title: Installation
sidebar_position: 2
---

## Installing the Core Package

DugongJS consists of multiple packages that can be installed individually as needed. The core package is always required:

```bash npm2yarn
npm install @dugongjs/core
```

The core package provides everything needed to define aggregates and domain events, as well as factories and managers to load aggregates and persist changes. It also exposes a set of ports and some basic adapters for persistence, transaction management and messaging.

While you can use the core package directly, DugongJS also provides several packages for integration with other frameworks and adapters for infrastructure.

## Installing the CLI

DugongJS comes with a command-line interface (CLI) tool that can be used for inspecting and interacting with event-sourced aggregates. To install the CLI, run:

```bash npm2yarn
npm install --save-dev @dugongjs/cli
```

## Integrations

### NestJS

The best way to get started with DugongJS and NestJS is to [follow the NestJS tutorial](../tutorial-nestjs/part_0.md).

Install the NestJS integration package:

```bash npm2yarn
npm install @dugongjs/nestjs
```

To enable synchronous IPC or the DugongJS CLI, also install the following:

```bash npm2yarn
npm install @nestjs/microservices @dugongjs/nestjs-microservice-query
```

## Adapters

### TypeORM

DugongJS provides a TypeORM adapter for integrating with TypeORM. To install the TypeORM adapter, run:

```bash npm2yarn
npm install typeorm @dugongjs/typeorm
```

For NestJS integration with TypeORM, also install the following:

```bash npm2yarn
npm install @nestjs/typeorm @dugongjs/nestjs-typeorm
```

### Kafka

DugongJS provides a Kafka adapter for messaging using Apache Kafka. To install the Kafka adapter, run:

```bash npm2yarn
npm install kafkajs @dugongjs/kafka
```

For NestJS integration with Kafka, also install the following:

```bash npm2yarn
npm install @dugongjs/nestjs-kafka
```
