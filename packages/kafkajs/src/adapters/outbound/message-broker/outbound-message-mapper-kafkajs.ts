import type { IOutboundMessageMapper, SerializedDomainEvent } from "@dugongjs/core";
import type { Message } from "kafkajs";

/**
 * OutboundMessageMapperKafkaJs is an implementation of the IOutboundMessageMapper interface that maps a SerializedDomainEvent to a KafkaJs Message format, including the necessary headers and payload for publishing to Kafka topics.
 */
export class OutboundMessageMapperKafkaJs implements IOutboundMessageMapper<Message> {
    /**
     * Maps a SerializedDomainEvent to a KafkaJs Message by extracting the relevant fields and constructing the message with appropriate headers and payload. The method ensures that all required fields are included in the message headers and that the payload is properly serialized as a JSON string.
     * @param domainEvent The SerializedDomainEvent to be mapped to a KafkaJs Message.
     * @returns A KafkaJs Message object constructed from the SerializedDomainEvent, ready to be published to a Kafka topic. The message includes the aggregate ID as the key, the payload as the value, and all relevant fields as headers for proper processing by consumers.
     */
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
