import type { IOutboundMessageMapper, SerializedDomainEvent } from "@dugongjs/core";
import type { OutboxRecord } from "../../../infrastructure/db/records/outbox-record.js";

export class OutboxMessageMapperTypeOrm implements IOutboundMessageMapper<OutboxRecord> {
    public map(domainEvent: SerializedDomainEvent): OutboxRecord {
        return { ...domainEvent, channelId: "" } as OutboxRecord;
    }
}
