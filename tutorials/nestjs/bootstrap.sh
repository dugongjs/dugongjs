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