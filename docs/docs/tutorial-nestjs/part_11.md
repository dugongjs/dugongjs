---
title: "Part 11 - Restoring Transactionality with the Outbox Pattern"
sidebar_position: 12
---

![DugongJS + NestJS](/img/dugongjs_nestjs.png)

In the previous part, we demonstrated a critical flaw: after switching from the in-memory message broker to Kafka, our system lost its transactionality. Specifically, we observed that domain events could be published to Kafka even if the corresponding transaction on the command side failed — leading to potential divergence between services.

In this part, we will solve this using the _outbox pattern_. We will implement an _asymmetric messaging strategy_ where KafkaJS is still used to set up consumers, but an outbox database table will take on the role as the producer.

### Background

The outbox pattern is a widely used approach to ensure reliable message publishing in the face of application errors or database and network failures. Instead of sending messages directly to a message broker (which happens outside the boundaries of a database transaction), the message is first written to an “outbox” table in the same database, as part of the current transaction. If the transaction commits, the message is persisted along with any other changes.

A separate message relay process (commonly called an “outbox processor” or “log miner”) then picks up these messages and forwards them to the actual message broker — ensuring that only successfully committed messages are ever published.

This decoupling guarantees that if a transaction fails, no message will be published, because nothing is ever written to the outbox table.

To learn more about the theory and practical implementations of the outbox pattern, check out [this article by Gunnar Morling](https://debezium.io/blog/2019/02/19/reliable-microservices-data-exchange-with-the-outbox-pattern/?ref=enmilocalfunciona.io).

### Setting Up Kafka Connect

We can integrate the outbox pattern with minimal code changes, but it does require a bit of additional infrastructure, as we will be setting up [Kafka Connect](https://docs.confluent.io/platform/current/connect/index.html) and [Debezium](https://debezium.io/). Let’s begin by updating our `docker-compose.yaml`:

#### Docker Compose Changes

We’ll make three important updates:

1. Add the PostgreSQL container to the same Docker network as Kafka.
2. Adjust PostgreSQL settings to enable logical replication.
3. Add a Kafka Connect container that runs Debezium.

```yaml docker-compose.yaml showLineNumbers
<!-- prettier-ignore-start -->
networks:
  kafka-net:
    driver: bridge

services:
  postgres:
    image: postgres:14
    container_name: dugongjs_nestjs_tutorial_account_service_db
    restart: unless-stopped
    <!-- highlight-start -->
    networks:
      - kafka-net
    <!-- highlight-end -->
    environment:
      POSTGRES_USER: postgres_user
      POSTGRES_PASSWORD: postgres_password
      POSTGRES_DB: account_service_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    <!-- highlight-start -->
    command:
      - "postgres"
      - "-c"
      - "wal_level=logical"
      - "-c"
      - "max_wal_senders=1"
      - "-c"
      - "max_replication_slots=1"
    <!-- highlight-end -->

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
      KAFKA_ZOOKEEPER_CONNECT: 'zookeeper:2181'
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: 1
      KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 1
      KAFKA_LISTENERS: PLAINTEXT_INTERNAL://0.0.0.0:29092,PLAINTEXT_C://0.0.0.0:9093,PLAINTEXT_L://0.0.0.0:9092,
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT_INTERNAL://kafka:29092,PLAINTEXT_L://localhost:9092,PLAINTEXT_C://kafka:9093
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT_INTERNAL:PLAINTEXT,PLAINTEXT_L:PLAINTEXT,PLAINTEXT_C:PLAINTEXT
      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT_INTERNAL

  <!-- highlight-start -->
  kafka-connect:
    image: debezium/connect:2.4
    container_name: dugongjs_nestjs_tutorial_kafka_connect
    depends_on:
    - kafka
    - postgres
    ports:
    - "8083:8083"
    environment:
      BOOTSTRAP_SERVERS: kafka:9093
      GROUP_ID: kafka-connect-group
      CONFIG_STORAGE_TOPIC: kafka-connect-configs
      OFFSET_STORAGE_TOPIC: kafka-connect-offsets
      STATUS_STORAGE_TOPIC: kafka-connect-status
      CONNECT_REST_ADVERTISED_HOST_NAME: kafka-connect
      CONNECT_REST_PORT: 8083
      CONNECT_PLUGIN_PATH: /kafka/connect,/debezium/connectors
    networks:
      - kafka-net
  <!-- highlight-end -->

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

volumes:
  postgres_data:
<!-- prettier-ignore-end -->
```

#### Setting Up Debezium

Debezium is a change data capture (CDC) tool that integrates with Kafka Connect. We’ll configure it to monitor the outbox table and emit messages based on committed rows.

Create a `connector.config.json` file with the following contents:

```json connector.config.json showLineNumbers
{
    "name": "outbox-connector",
    "config": {
        "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
        "tasks.max": "1",
        "plugin.name": "pgoutput",
        "topic.prefix": "outbox",
        "table.include.list": "public.outbox",

        "database.hostname": "postgres",
        "database.port": "5432",
        "database.user": "postgres_user",
        "database.password": "postgres_password",
        "database.dbname": "account_service_db",

        "transforms": "outbox",
        "transforms.outbox.type": "io.debezium.transforms.outbox.EventRouter",
        "transforms.outbox.route.by.field": "channelId",
        "transforms.outbox.route.topic.replacement": "${routedByValue}",
        "transforms.outbox.table.field.event.id": "id",
        "transforms.outbox.table.field.event.key": "aggregateId",
        "transforms.outbox.table.field.event.payload": "payload",
        "transforms.outbox.table.fields.additional.placement": "origin:header,aggregateType:header,type:header,version:header,sequenceNumber:header,timestamp:header,correlationId:header,triggeredByUserId:header,triggeredByEventId:header,metadata:header",
        "transforms.outbox.table.expand.json.payload": "true",
        "transforms.outbox.table.json.payload.null.behavior": "ignore",
        "transforms.outbox.route.tombstone.on.empty.payload": "true",

        "key.converter": "io.debezium.converters.BinaryDataConverter",
        "key.converter.delegate.converter.type": "org.apache.kafka.connect.storage.StringConverter",
        "key.converter.delegate.converter.type.schemas.enable": "false",

        "value.converter": "io.debezium.converters.BinaryDataConverter",
        "value.converter.delegate.converter.type": "org.apache.kafka.connect.json.JsonConverter",
        "value.converter.delegate.converter.type.schemas.enable": "false"
    }
}
```

### Breakdown of the Debezium Configuration

Debezium is a complex platform with many configurable parameters. Here’s a brief summary of what each part of the configuration does:

#### 1. Plugin and Table Selection

```json
{
    "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
    "tasks.max": "1",
    "plugin.name": "pgoutput",
    "topic.prefix": "outbox",
    "table.include.list": "public.outbox"
}
```

- `connector.class`: Tells Kafka Connect to use the PostgreSQL connector from Debezium.
- `plugin.name`: Specifies the logical decoding output plugin used by PostgreSQL. pgoutput is the default used for logical replication.
- `topic.prefix`: Required by Debezium, even though it’s overridden by our outbox transformation. It normally controls the prefix of generated Kafka topics. Although it is not used, Debezium requires it as part of its schema validation.
- `table.include.list`: Tells Debezium which tables to monitor. Here, it watches only the `outbox` table in the `public` schema.

#### 2. Database Connection

```json
{
    "database.hostname": "postgres",
    "database.port": "5432",
    "database.user": "postgres_user",
    "database.password": "postgres_password",
    "database.dbname": "account_service_db"
}
```

These settings configure the connection to our PostgreSQL database.

:::danger
In production, use environment variables or secret stores to manage credentials securely.
:::

:::danger
We are using the same credentials for both the NestJS application and Debezium. In production, this should be a dedicated user with only the minimal necessary permissions. [See the Debezium docs on PostgreSQL permissions](https://debezium.io/documentation/reference/stable/connectors/postgresql.html#postgresql-permissions).
:::

#### 3. Outbox Plugin Settings

```json
{
    "transforms": "outbox",
    "transforms.outbox.type": "io.debezium.transforms.outbox.EventRouter",
    "transforms.outbox.route.by.field": "channelId",
    "transforms.outbox.route.topic.replacement": "${routedByValue}",
    "transforms.outbox.table.field.event.id": "id",
    "transforms.outbox.table.field.event.key": "aggregateId",
    "transforms.outbox.table.field.event.payload": "payload",
    "transforms.outbox.table.fields.additional.placement": "origin:header,aggregateType:header,type:header,version:header,sequenceNumber:header,timestamp:header,correlationId:header,triggeredByUserId:header,triggeredByEventId:header,metadata:header",
    "transforms.outbox.table.expand.json.payload": "true",
    "transforms.outbox.table.json.payload.null.behavior": "ignore",
    "transforms.outbox.route.tombstone.on.empty.payload": "true"
}
```

This block configures Debezium to use the [Outbox Event Router](https://debezium.io/documentation/reference/stable/transformations/outbox-event-router.html) transformation. This is the crucial part that handles the transformation between our outbox table and Kafka messages.

Here’s what each setting does:

- `transforms`: Enables a named transformation — here called "outbox".
- `transforms.outbox.type`: Specifies that this transformation uses Debezium’s `EventRouter`, which rewrites database rows into structured Kafka messages.
- `transforms.outbox.route.by.field`: Specifies the database column used to dynamically determine the target Kafka topic. We’re using `channelId` for this.
- `transforms.outbox.route.topic.replacement`: Replaces the Kafka topic name with the value in `channelId`.
- `transforms.outbox.table.field.event.id`: The column storing the unique event ID.
- `transforms.outbox.table.field.event.key`: The column used as the Kafka message key — in this case, `aggregateId`.
- `transforms.outbox.table.field.event.payload`: The main payload column that contains the domain event data in serialized JSON.
- `transforms.outbox.table.fields.additional.placement`: Lists other fields to include in the Kafka message and where to place them — in this case, all as headers.
- `transforms.outbox.table.expand.json.payload`: Tells Debezium to expand the JSON payload into fields.

The configuration shown here exactly mimics the message producer adapter from `@dugongjs/kafkajs`. Messages emitted to Kafka through the outbox should therefore be indistinguishable from the ones emitted in the previous parts.

#### 4. Converters

```json
{
    "key.converter": "io.debezium.converters.BinaryDataConverter",
    "key.converter.delegate.converter.type": "org.apache.kafka.connect.storage.StringConverter",
    "key.converter.delegate.converter.type.schemas.enable": "false",

    "value.converter": "io.debezium.converters.BinaryDataConverter",
    "value.converter.delegate.converter.type": "org.apache.kafka.connect.json.JsonConverter",
    "value.converter.delegate.converter.type.schemas.enable": "false"
}
```

This section configures how Debezium serializes the Kafka message keys and values.

- `key.converter` and `value.converter` are both set to `BinaryDataConverter`, which allows us to delegate the actual conversion to a simpler underlying converter.
- For the key, we use a plain string converter.
- For the value, we use a JSON converter.

In both cases, we explicitly disable schema inclusion (`schemas.enable: false`). Without this setting, Debezium would include the full Avro-style schema along with each message. While this can be useful in some environments (such as those using schema registries), DugongJS does not use or require this metadata — so we disable it to reduce message size and simplify parsing.

### Creating a Bootstrap Script

Up until now, we’ve used `docker compose up` to run our containers. However, to include Debezium, we need to make a small adjustment. Kafka Connect exposes a REST API on `localhost:8083`, which we must call to register the Debezium connector. To automate this process, we’ll create the following `bootstrap.sh` script:

```sh title="bootstrap.sh" showLineNumbers
#!/bin/bash

set -euo pipefail

CONNECTOR_NAME="account-outbox-connector"
CONFIG_FILE="connector.config.json"
KAFKA_CONNECT_URL="http://localhost:8083/connectors"

echo "🛠️  Starting Docker Compose..."
docker compose up -d

echo "⏳ Waiting for Kafka Connect to be available..."
until curl -s "${KAFKA_CONNECT_URL}" > /dev/null; do
    sleep 2
done

echo "✅ Kafka Connect is up!"

if [[ ! -f "$CONFIG_FILE" ]]; then
    echo "❌ Connector config file '$CONFIG_FILE' not found!"
    exit 1
fi

echo "🚀 Submitting connector config..."
curl -s -X POST \
    -H "Content-Type: application/json" \
    --data @"$CONFIG_FILE" \
    "${KAFKA_CONNECT_URL}"

echo "✅ Debezium connector '${CONNECTOR_NAME}' created."
```

Make the script executable:

```bash
chmod +x ./bootstrap.sh
```

Now, instead of running:

```bash
docker compose up
```

Use the script:

```bash
./bootstrap.sh
```

To stop the running containers:

```bash
docker compose down
```

### Updating the Modules

Supporting the outbox pattern requires minimal changes to our source code. We do not need to install any additional dependencies, as the `@dugongjs/typeorm` and `@dugongjs/nestjs-typeorm` packages have everything we need. The first update is to our `data-source-config.ts`:

```typescript title="src/db/data-source-config.ts" showLineNumbers
import { ConsumedMessageEntity, DomainEventEntity, OutboxEntity, SnapshotEntity } from "@dugongjs/typeorm";
import type { DataSourceOptions } from "typeorm";
import { BankAccountQueryModelEntity } from "../bank-account/adapters/repository/bank-account-query-model.entity.js";

export const dataSourceOptions: DataSourceOptions = {
    type: "postgres",
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    synchronize: true,
    logging: false,
    entities: [
        DomainEventEntity,
        SnapshotEntity,
        ConsumedMessageEntity,
        // highlight-next-line
        OutboxEntity,
        BankAccountQueryModelEntity
    ]
};
```

Here we’ve added the `OutboxEntity`, which introduces the outbox table to our database schema.

Next, update `AppModule`:

```typescript title="src/app.module.ts" showLineNumbers
import { EventIssuerModule } from "@dugongjs/nestjs";
import { KafkaModule, MessageConsumerKafkaJSModule } from "@dugongjs/nestjs-kafkajs";
import { AggregateQueryMicroserviceModule } from "@dugongjs/nestjs-microservice-query";
import {
    OutboxMessageProducerTypeOrmModule,
    RepositoryTypeOrmModule,
    TransactionManagerTypeOrmModule
} from "@dugongjs/nestjs-typeorm";
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
        KafkaModule.forRoot({ brokers: process.env.KAFKA_BROKERS!.split(",") }),
        RepositoryTypeOrmModule.forRoot(),
        TransactionManagerTypeOrmModule.forRoot(),
        EventIssuerModule.forRoot({ currentOrigin: "BankingContext-AccountService" }),
        AggregateQueryMicroserviceModule,
        // highlight-start
        MessageConsumerKafkaJSModule.forRoot(),
        OutboxMessageProducerTypeOrmModule.forRoot(),
        // highlight-end
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

Two important changes have been made:

1. Switched from `MessageBrokerKafkaJSModule` to `MessageConsumerKafkaJSModule`: This module only registers Kafka as a _consumer_. Previously, we used `MessageBrokerKafkaJSModule`, which is a wrapper around both `MessageConsumerKafkaJSModule` and `MessageProducerKafkaJSModule`. Since message publishing is now handled via the outbox, we no longer need the Kafka producer.
2. Added `OutboxMessageProducerTypeOrmModule`: This enables DugongJS to write messages to the outbox table during the same database transaction as the command handling — ensuring transactionality.

In the next part we will once again evaluate the transactionality of the system.
