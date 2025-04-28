import type { SerializableObject } from "../../types/serializable-object.type.js";

export type SerializedDomainEvent = {
    origin: string;
    aggregateType: string;
    type: string;
    version: number;
    id: string;
    aggregateId: string;
    payload: SerializableObject | null;
    sequenceNumber: number;
    timestamp: Date;
    correlationId?: string;
    triggeredByEventId?: string;
    triggeredByUserId?: string;
    metadata?: SerializableObject;
};
