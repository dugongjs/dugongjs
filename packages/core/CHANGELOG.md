# @dugongjs/core

## 0.0.18

### Patch Changes

- 6249b05: Added in-memory adapters for repository and transaction ports

## 0.0.17

### Patch Changes

- 906b45e: Fixed an issue with `DomainEventClass` not recognizing events created using `fromSchema`

## 0.0.16

### Patch Changes

- 58f4863: Added missing type exports

## 0.0.15

### Patch Changes

- 549ac9b: Added support for Standard Schema validation of domain event payloads

## 0.0.14

### Patch Changes

- 10006c5: `Process` decorator now supports async commands

## 0.0.13

### Patch Changes

- 67acd5e: `AggregateContext.withTenantId()` now preserves transaction context from factory/manager when creating a new context

## 0.0.12

### Patch Changes

- 6a00551: Changed snapshotting to be threshold based (instead of modulo based) and added snapshotting to `AggregateFactory.buildFromEventLog`
- d8d23c2: Update `AggregateMetadataRegistry` to support prototype chain traversal during metadata lookup

## 0.0.11

### Patch Changes

- fa4995f: Fixed an issue with SerializableObject preventing primitive arrays

## 0.0.10

### Patch Changes

- 1576b2a: Added snapshot validity checks before persisting snapshots

## 0.0.9

### Patch Changes

- d6bff86: Fixed an issue with default type parameter for `HandleMessage` and `HandleMessageContext` types

## 0.0.8

### Patch Changes

- d4b9b59: Added support for default domain event appliers in aggregates by using an empty `@Apply()` decorator

## 0.0.7

### Patch Changes

- 18ef4ca: Added initial support for soft multi-tenancy

## 0.0.6

### Patch Changes

- fbf3393: `AggregateFactory` can now accept an `externalOriginMap` constructor parameter to fetch missing domain events from other origins

## 0.0.5

### Patch Changes

- 40ad156: Added `waitForMessagesToBeConsumed` method to `WaitForMessageConsumer`

## 0.0.4

### Patch Changes

- 15c618f: Constant properties of domain event classes are now abstract instance properties instead of static properties
- 9dee746: Replaced IMessageSerdes port with IInboundMessageMapper and IOutboundMessageMapper to support asymmetric publish/consume paradigms

## 0.0.3

### Patch Changes

- 2018709: Changed the way internal classes handle transactions and added InMemoryMessageBus

## 0.0.2

### Patch Changes

- 9e6c970: Initial release
