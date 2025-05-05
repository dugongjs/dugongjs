import { IMessageSerdes, type SerializedDomainEvent } from "@dugongjs/core";
import type { OutboxEntity } from "../../../infrastructure/index.js";

export class OutboxMessageSerdesTypeOrm implements IMessageSerdes<OutboxEntity> {
    public wrapDomainEvent(domainEvent: SerializedDomainEvent): OutboxEntity {
        return { ...domainEvent, channelId: "" };
    }

    public unwrapMessage(message: OutboxEntity): SerializedDomainEvent {
        return message;
    }
}
