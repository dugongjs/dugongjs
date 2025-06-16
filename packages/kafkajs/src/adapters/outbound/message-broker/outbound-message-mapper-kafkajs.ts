import type { IOutboundMessageMapper, SerializedDomainEvent } from "@dugongjs/core";
import type { Message } from "kafkajs";

export class OutboundMessageMapperKafkaJS implements IOutboundMessageMapper<Message> {
    public map(domainEvent: SerializedDomainEvent): Message {
        const {
            id,
            origin,
            aggregateType,
            aggregateId,
            type,
            version,
            sequenceNumber,
            timestamp,
            tenantId,
            correlationId,
            triggeredByUserId,
            triggeredByEventId,
            metadata,
            payload
        } = domainEvent;

        const message: Message = {
            key: Buffer.from(aggregateId),
            value: payload ? Buffer.from(JSON.stringify(payload)) : null,
            headers: {
                id: Buffer.from(id),
                origin: Buffer.from(origin),
                aggregateType: Buffer.from(aggregateType),
                type: Buffer.from(type),
                version: Buffer.from(version.toString()),
                sequenceNumber: Buffer.from(sequenceNumber.toString()),
                timestamp: Buffer.from(timestamp.getTime().toString()),
                tenantId: tenantId ? Buffer.from(tenantId) : undefined,
                correlationId: correlationId ? Buffer.from(correlationId) : undefined,
                triggeredByUserId: triggeredByUserId ? Buffer.from(triggeredByUserId) : undefined,
                triggeredByEventId: triggeredByEventId ? Buffer.from(triggeredByEventId) : undefined,
                metadata: metadata ? Buffer.from(JSON.stringify(metadata)) : undefined
            }
        };

        // Kafka headers cannot have null/undefined values
        for (const [key, value] of Object.entries(message.headers ?? {})) {
            if (value == null) {
                delete message.headers![key];
            }
        }

        return message;
    }
}
