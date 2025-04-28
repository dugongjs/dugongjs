import type { SerializedSnapshot } from "@dugongjs/core";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

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

    @Column({ type: "int" })
    domainEventSequenceNumber: number;

    @Column({ type: "jsonb" })
    snapshotData: any;
}
