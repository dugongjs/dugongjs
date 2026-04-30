import { Column, Entity, PrimaryGeneratedColumn, Unique } from "typeorm";
import { NO_TENANT_ID } from "../no-tenant-id.js";

@Entity("consumed_messages")
@Unique(["domainEventId", "consumerId", "tenantId"])
export class ConsumedMessageEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "uuid" })
    domainEventId: string;

    @Column({ type: "varchar", length: 255 })
    consumerId: string;

    @Column({ type: "varchar", length: 255, default: NO_TENANT_ID })
    tenantId: string;
}
