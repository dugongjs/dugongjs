---
"@dugongjs/typeorm": patch
---

Fixed an issue with tenant handling in repository persistence and read operations, and aligned transaction manager behavior with the contract test suite - **This update changes tenant-related database column defaults/nullability and requires a database migration**
