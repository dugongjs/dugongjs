import { Column, Entity } from "typeorm";
import type { OutboxRecord } from "../../records/outbox-record.js";
import { DomainEventEntity } from "./domain-event.entity.js";

@Entity("outbox")
export class OutboxEntity extends DomainEventEntity implements OutboxRecord {
    @Column({ type: "varchar", length: 255 })
    channelId: string;
}
