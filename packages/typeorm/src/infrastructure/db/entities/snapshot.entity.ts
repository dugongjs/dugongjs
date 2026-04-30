import type { SerializedSnapshot } from "@dugongjs/core";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { NO_TENANT_ID } from "../no-tenant-id.js";

@Entity("snapshots")
export class SnapshotEntity implements SerializedSnapshot {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar", length: 255 })
    origin: string;

    @Column({ type: "varchar", length: 255 })
    aggregateType: string;

    @Column({ type: "uuid" })
    aggregateId: string;

    @Column({ type: "varchar", length: 255, default: NO_TENANT_ID })
    tenantId: string;

    @Column({ type: "int" })
    domainEventSequenceNumber: number;

    @Column({ type: "jsonb" })
    snapshotData: any;
}
