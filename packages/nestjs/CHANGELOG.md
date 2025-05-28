# @dugongjs/nestjs

## 0.0.12

### Patch Changes

- e50cf89: `QueryModelProjectionConsumerModule` now exposes `handleMessageOptions` which is passed to the internal `AggregateMessageConsumerService`

## 0.0.11

### Patch Changes

- 40ad156: Added `waitForMessagesToBeConsumed` method to `WaitForMessageConsumer`
- Updated dependencies [40ad156]
    - @dugongjs/core@0.0.5

## 0.0.10

### Patch Changes

- 4e5dd9b: Fixed an error when calling `EventSourcingService.createAggregateContext` with type `AbstractEventSourcedAggregateRoot`

## 0.0.9

### Patch Changes

- 92dde63: Fix type parameter in `AggregateMessageConsumerService.registerMessageConsumerForAggregate`

## 0.0.8

### Patch Changes

- e67a9f9: Added missing export of `AggregateMessageConsumerService`
- e67a9f9: Fixed incorrect type parameter in `AggregateMessageProducerService.publishDomainEventsAsMessages`

## 0.0.7

### Patch Changes

- 8135291: Added `AggregateMessageProducerService`

## 0.0.6

### Patch Changes

- a95241a: Added `WaitForConsumerService`

## 0.0.5

### Patch Changes

- 9dee746: Replaced IMessageSerdes port with IInboundMessageMapper and IOutboundMessageMapper to support asymmetric publish/consume paradigms
- Updated dependencies [15c618f]
- Updated dependencies [9dee746]
    - @dugongjs/core@0.0.4

## 0.0.4

### Patch Changes

- 9c901ca: Added services and modules for messaging
- 2018709: Updated EventSourcingService after breaking change in @dugongjs/core
- Updated dependencies [2018709]
    - @dugongjs/core@0.0.3

## 0.0.3

### Patch Changes

- 3c1c5be: Initial release

## 0.0.2

### Patch Changes

- Updated dependencies [9e6c970]
    - @dugongjs/core@0.0.2
