---
title: "Part 9 - Switching to Kafka"
sidebar_position: 10
---

![DugongJS + NestJS](/img/dugongjs_nestjs.png)

In this part, we’ll replace the in-memory message broker configured earlier with Kafka — a production-ready inter-process message broker.

### Running Kafka Locally

Update your `docker-compose.yaml` to include Kafka, Zookeeper, and a UI client. Make sure to also set up the `kafka-net` network:

```yaml title="docker-compose.yaml" showLineNumbers
<!-- prettier-ignore-start -->
<!-- highlight-start -->
networks:
  kafka-net:
    driver: bridge
<!-- highlight-end -->

services:
  postgres:
    image: postgres:14
    container_name: dugongjs_nestjs_tutorial_account_service_db
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres_user
      POSTGRES_PASSWORD: postgres_password
      POSTGRES_DB: account_service_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  <!-- highlight-start -->
  zookeeper:
    image: confluentinc/cp-zookeeper:7.4.0
    container_name: dugongjs_nestjs_tutorial_zookeeper
    networks:
      - kafka-net
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000

  kafka:
    image: confluentinc/cp-kafka:7.4.0
    container_name: dugongjs_nestjs_tutorial_kafka
    networks:
      - kafka-net
    ports:
      - "9092:9092"
      - "9093:9093"
    depends_on:
      - zookeeper
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: "zookeeper:2181"
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: 1
      KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 1
      KAFKA_LISTENERS: PLAINTEXT_INTERNAL://0.0.0.0:29092,PLAINTEXT_C://0.0.0.0:9093,PLAINTEXT_L://0.0.0.0:9092,
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT_INTERNAL://kafka:29092,PLAINTEXT_L://localhost:9092,PLAINTEXT_C://kafka:9093
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT_INTERNAL:PLAINTEXT,PLAINTEXT_L:PLAINTEXT,PLAINTEXT_C:PLAINTEXT
      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT_INTERNAL

  kafka-ui:
    image: provectuslabs/kafka-ui:latest
    container_name: dugongjs_nestjs_tutorial_kafka_ui
    networks:
      - kafka-net
    ports:
      - "8080:8080"
    depends_on:
      - kafka
    environment:
      KAFKA_CLUSTERS_0_NAME: local
      KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS: kafka:9093
      KAFKA_CLUSTERS_0_ZOOKEEPER: zookeeper:2181
  <!-- highlight-end -->

volumes:
  postgres_data:
<!-- prettier-ignore-end -->
```

Then run:

```bash
docker compose up
```

This starts

- Zookeeper (required by Kafka).
- Kafka
- Kafka UI (a web interface for monitoring Kafka)

Kafka will be accessible at localhost:9092. To view Kafka messages, navigate to http://localhost:8080 in your browser.

### Installing Dependencies

Install the Kafka packages for DugongJS and NestJS:

```bash npm2yarn
npm install kafkajs @dugong/kafkajs @dugong/nestjs-kafkajs
```

### Replacing the In-Memory Message Broker With Kafka

First, add the Kafka broker config to your `.env` file:

```conf showLineNumbers
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres_user
DB_PASSWORD=postgres_password
DB_NAME=account_service_db
// highlight-next-line
KAFKA_BROKERS=localhost:9092
```

Then update your `AppModule`. Remove the `MessageBrokerInMemoryModule` and instead import `KafkaModule` and `MessageBrokerKafkaJSModule` from `@dugongjs/nestjs-kafkajs`:

```typescript title="src/app.module.ts" showLineNumbers
import { EventIssuerModule } from "@dugongjs/nestjs";
import { KafkaModule, MessageBrokerKafkaJSModule } from "@dugongjs/nestjs-kafkajs";
import { AggregateQueryMicroserviceModule } from "@dugongjs/nestjs-microservice-query";
import { RepositoryTypeOrmModule, TransactionManagerTypeOrmModule } from "@dugongjs/nestjs-typeorm";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BankAccountQueryModelReadRepositoryTypeOrmService } from "./bank-account/adapters/repository/bank-account-query-model-read-repository-typeorm.service.js";
import { BankAccountQueryModelWriteRepositoryTypeOrmService } from "./bank-account/adapters/repository/bank-account-query-model-write-repository-typeorm.service.js";
import { BankAccountQueryModelEntity } from "./bank-account/adapters/repository/bank-account-query-model.entity.js";
import { BankAccountCommandModule } from "./bank-account/application/command/bank-account.command.module.js";
import { BankAccountQueryModelProjectionConsumerModule } from "./bank-account/application/consumer/bank-account-query-model-projection-consumer.module.js";
import { BankAccountQueryModule } from "./bank-account/application/query/bank-account.query.module.js";
import { dataSourceOptions } from "./db/data-source-options.js";

@Module({
    imports: [
        TypeOrmModule.forRoot(dataSourceOptions),
        // highlight-next-line
        KafkaModule.forRoot({ brokers: process.env.KAFKA_BROKERS!.split(",") }),
        RepositoryTypeOrmModule.forRoot(),
        TransactionManagerTypeOrmModule.forRoot(),
        EventIssuerModule.forRoot({ currentOrigin: "BankingContext-AccountService" }),
        AggregateQueryMicroserviceModule,
        // highlight-next-line
        MessageBrokerKafkaJSModule.forRoot(),
        BankAccountCommandModule,
        BankAccountQueryModelProjectionConsumerModule.register({
            repository: BankAccountQueryModelWriteRepositoryTypeOrmService
        }),
        BankAccountQueryModule.register({
            module: { imports: [TypeOrmModule.forFeature([BankAccountQueryModelEntity])] },
            repository: BankAccountQueryModelReadRepositoryTypeOrmService
        })
    ]
})
export class AppModule {}
```

Restart the application to apply the changes.

### Testing the Adapter

Use curl or Postman to invoke some operations — open new accounts, deposit and withdraw money, or close accounts.

Once events are generated, open http://localhost:8080 and go to the _Topics_ section in Kafka UI. You should see a topic named something like:

```
banking-context-account-service-bank-account
```

This name is automatically generated from the configured [origin](../core-concepts/origin.md) and the name of the [aggregate](../core-concepts/aggregates.md).

Select the topic and go to the _Messages_ tab. Here, you’ll see every published domain event. Each message includes:

- Key: the aggregate ID.
- Value: the event payload.
- Headers: remaining event metadata.

:::tip
Kafka UI is a good tool for monitoring and debugging Kafka related issues. However, its usefulness for debugging domain events and aggregates is limited similarly to database clients. The Dugong CLI configured in [part 5](part_5.md) is generally a better fit for understanding the behavior of domain events and aggregates.
:::
