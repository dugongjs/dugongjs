---
"@dugongjs/core": patch
"@dugongjs/nestjs": patch
---

Errors raised while propagating a transaction context to the aggregate manager are no longer swallowed. Only `AggregateManagerNotAvailableError`, which is expected for aggregates without a manager, is ignored
