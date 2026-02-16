---
"@dugongjs/kafkajs": patch
---

Added retry logic to `MessageConsumerKafkaJS.registerDomainEventMessageConsumer` to allow topic autocreation when running Kafka with KRaft
