---
"@dugongjs/core": patch
---

Added an `upcast` lifecycle hook to `AbstractDomainEvent`, which is followed on deserialization to replay events stored at an older version as their latest version
