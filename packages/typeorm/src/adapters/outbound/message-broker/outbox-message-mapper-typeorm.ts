import type { IOutboundMessageMapper, SerializedDomainEvent } from "@dugongjs/core";
import type { OutboxEntity } from "../../../infrastructure/db/entities/outbox-entity.js";

export class OutboxMessageMapperTypeOrm implements IOutboundMessageMapper<OutboxEntity> {
    public map(domainEvent: SerializedDomainEvent): OutboxEntity {
        return { ...domainEvent, channelId: "" };
    }
}
