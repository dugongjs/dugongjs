# @dugongjs/core

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
