---
"@dugongjs/core": patch
"@dugongjs/nestjs": patch
---

Aggregate queries now enforce the aggregate's tenancy declaration on every operation, where previously only `getAggregate` did
