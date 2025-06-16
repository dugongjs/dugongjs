import type { IInboundMessageMapper, SerializedDomainEvent } from "@dugongjs/core";
import type { EachMessagePayload } from "kafkajs";

export class InboundMessageMapperKafkaJS implements IInboundMessageMapper<EachMessagePayload> {
    public map(messagePayload: EachMessagePayload): SerializedDomainEvent {
        const message = messagePayload.message;
        const headers = message.headers;
        const key = message.key;
        const value = message.value;

        if (!headers) {
            throw new Error("Headers are missing in the message");
        }

        if (!key) {
            throw new Error("Key is missing in the message");
        }

        const id = headers.id?.toString();
        const origin = headers.origin?.toString();
        const aggregateType = headers.aggregateType?.toString();
        const aggregateId = key.toString();
        const type = headers.type?.toString();
        const version = headers.version ? parseInt(headers.version!.toString()) : undefined;
        const sequenceNumber = headers.sequenceNumber ? parseInt(headers.sequenceNumber.toString()) : undefined;
        const timestamp = headers.timestamp ? new Date(parseInt(headers.timestamp.toString())) : undefined;
        const tenantId = headers.tenantId?.toString();
        const correlationId = headers.correlationId?.toString();
        const triggeredByUserId = headers.triggeredByUserId?.toString();
        const triggeredByEventId = headers.triggeredByEventId?.toString();
        const metadata = headers.metadata ? JSON.parse(headers.metadata.toString()) : null;
        const payload = value ? JSON.parse(value.toString()) : null;

        if (
            !id ||
            !origin ||
            !aggregateType ||
            !aggregateId ||
            !type ||
            typeof version !== "number" ||
            typeof sequenceNumber !== "number" ||
            !timestamp
        ) {
            const missingRequiredFields: string[] = [];

            if (!id) missingRequiredFields.push("id");
            if (!origin) missingRequiredFields.push("origin");
            if (!aggregateType) missingRequiredFields.push("aggregateType");
            if (!aggregateId) missingRequiredFields.push("aggregateId");
            if (!type) missingRequiredFields.push("type");
            if (typeof version !== "number") missingRequiredFields.push("version");
            if (typeof sequenceNumber !== "number") missingRequiredFields.push("sequenceNumber");
            if (!timestamp) missingRequiredFields.push("timestamp");

            throw new Error(`Missing required fields: ${missingRequiredFields.join(", ")}`);
        }

        const serializedDomainEvent: SerializedDomainEvent = {
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
        };

        return serializedDomainEvent;
    }
}
