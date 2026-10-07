---
"@dugongjs/core": patch
---

`@Process()` methods now throw `StateMutatedInProcessContextError` if they mutate aggregate state directly, since such mutations are not recorded in the event log and do not survive reconstruction of the aggregate (`@Process({ allowStateMutation: true })` allows bypassing)
