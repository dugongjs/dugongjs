import type { SerializedDomainEvent } from "@dugongjs/core";
import { Column, Entity, Index, PrimaryColumn, Unique } from "typeorm";

@Entity("domain_events")
@Unique(["origin", "aggregateType", "aggregateId", "tenantId", "sequenceNumber"])
export class DomainEventEntity implements SerializedDomainEvent {
    @PrimaryColumn({ type: "uuid" })
    id: string;

    @Column({ type: "varchar", length: 255 })
    origin: string;

    @Column({ type: "varchar", length: 255 })
    aggregateType: string;

    @Column({ type: "varchar", length: 255 })
    type: string;

    @Column({ type: "int" })
    version: number;

    @Index()
    @Column({ type: "uuid" })
    aggregateId: string;

    @Column({ type: "jsonb", nullable: true })
    payload: any;

    @Column({ type: "int" })
    sequenceNumber: number;

    @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP", update: false })
    timestamp: Date;

    @Column({ type: "varchar", length: 255, nullable: true })
    tenantId?: string;

    @Column({ type: "uuid", nullable: true })
    correlationId?: string;

    @Column({ type: "uuid", nullable: true })
    triggeredByEventId?: string;

    @Column({ type: "uuid", nullable: true })
    triggeredByUserId?: string;

    @Column({ type: "jsonb", nullable: true })
    metadata?: any;
}
