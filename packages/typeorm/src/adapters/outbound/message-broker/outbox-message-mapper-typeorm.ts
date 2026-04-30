import type { IOutboundMessageMapper, SerializedDomainEvent } from "@dugongjs/core";
import type { OutboxEntity } from "../../../infrastructure/db/entities/outbox-entity.js";
import { normalizeTenantId } from "../../../infrastructure/db/no-tenant-id.js";

export class OutboxMessageMapperTypeOrm implements IOutboundMessageMapper<OutboxEntity> {
    public map(domainEvent: SerializedDomainEvent): OutboxEntity {
        return { ...domainEvent, tenantId: normalizeTenantId(domainEvent.tenantId), channelId: "" };
    }
}
