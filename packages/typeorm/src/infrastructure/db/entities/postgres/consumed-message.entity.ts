import { Column, Entity, PrimaryGeneratedColumn, Unique } from "typeorm";
import type { ConsumedMessageRecord } from "../../records/consumed-message-record.js";

@Entity("consumed_messages")
@Unique(["domainEventId", "consumerId", "tenantId"])
export class ConsumedMessageEntity implements ConsumedMessageRecord {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "uuid" })
    domainEventId: string;

    @Column({ type: "varchar", length: 255 })
    consumerId: string;

    @Column({ type: "varchar", length: 255 })
    tenantId: string;
}
