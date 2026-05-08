# @dugongjs/typeorm

## 0.0.27

### Patch Changes

- 1f1492a: Fixed an issue with idempotent saves in the domain events repository
- Updated dependencies [1f1492a]
    - @dugongjs/core@0.0.21

## 0.0.26

### Patch Changes

- Updated dependencies [a470809]
    - @dugongjs/core@0.0.20

## 0.0.25

### Patch Changes

- 5ba2123: Removed default value for `tenantId` from all entities`

## 0.0.24

### Patch Changes

- a6c3b37: Fixed an issue with the tenantId field on the outbox entity

## 0.0.23

### Patch Changes

- dd6a3b7: Removed default tenant ID from outbox entity

## 0.0.22

### Patch Changes

- 667eddf: Fixed an issue with empty tenant ID filtering
- Updated dependencies [667eddf]
    - @dugongjs/core@0.0.19

## 0.0.21

### Patch Changes

- Updated dependencies [6249b05]
    - @dugongjs/core@0.0.18

## 0.0.20

### Patch Changes

- b559d45: Fixed an issue with tenant handling in repository persistence and read operations, and aligned transaction manager behavior with the contract test suite - **This update changes tenant-related database column defaults/nullability and requires a database migration**

## 0.0.19

### Patch Changes

- Updated dependencies [906b45e]
    - @dugongjs/core@0.0.17

## 0.0.18

### Patch Changes

- Updated dependencies [58f4863]
    - @dugongjs/core@0.0.16

## 0.0.17

### Patch Changes

- Updated dependencies [549ac9b]
    - @dugongjs/core@0.0.15

## 0.0.16

### Patch Changes

- Updated dependencies [10006c5]
    - @dugongjs/core@0.0.14

## 0.0.15

### Patch Changes

- Updated dependencies [67acd5e]
    - @dugongjs/core@0.0.13

## 0.0.14

### Patch Changes

- Updated dependencies [6a00551]
- Updated dependencies [d8d23c2]
    - @dugongjs/core@0.0.12

## 0.0.13

### Patch Changes

- Updated dependencies [fa4995f]
    - @dugongjs/core@0.0.11

## 0.0.12

### Patch Changes

- Updated dependencies [1576b2a]
    - @dugongjs/core@0.0.10

## 0.0.11

### Patch Changes

- Updated dependencies [d6bff86]
    - @dugongjs/core@0.0.9

## 0.0.10

### Patch Changes

- Updated dependencies [d4b9b59]
    - @dugongjs/core@0.0.8

## 0.0.9

### Patch Changes

- 4a1c6f9: Fixed an issue where domain events were not properly loaded after performing a snapshot recovery

## 0.0.8

### Patch Changes

- 18ef4ca: Fix breaking changes introduced in core
- Updated dependencies [18ef4ca]
    - @dugongjs/core@0.0.7

## 0.0.7

### Patch Changes

- Updated dependencies [fbf3393]
    - @dugongjs/core@0.0.6

## 0.0.6

### Patch Changes

- Updated dependencies [40ad156]
    - @dugongjs/core@0.0.5

## 0.0.5

### Patch Changes

- 9dee746: Replaced IMessageSerdes port with IInboundMessageMapper and IOutboundMessageMapper to support asymmetric publish/consume paradigms
- Updated dependencies [15c618f]
- Updated dependencies [9dee746]
    - @dugongjs/core@0.0.4

## 0.0.4

### Patch Changes

- Updated dependencies [2018709]
    - @dugongjs/core@0.0.3

## 0.0.3

### Patch Changes

- 017dcc0: Initial release

## 0.0.2

### Patch Changes

- Updated dependencies [9e6c970]
    - @dugongjs/core@0.0.2
