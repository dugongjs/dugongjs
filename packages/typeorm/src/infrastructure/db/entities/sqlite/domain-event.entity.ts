import type { SerializedDomainEvent } from "@dugongjs/core";
import { Column, Entity, Index, PrimaryColumn, Unique } from "typeorm";

@Entity("domain_events")
@Unique(["origin", "aggregateType", "aggregateId", "tenantId", "sequenceNumber"])
export class DomainEventEntity implements SerializedDomainEvent {
    @PrimaryColumn({ type: "varchar", length: 36 })
    id: string;

    @Column({ type: "varchar", length: 255 })
    origin: string;

    @Column({ type: "varchar", length: 255 })
    aggregateType: string;

    @Column({ type: "varchar", length: 255 })
    type: string;

    @Column({ type: "integer" })
    version: number;

    @Index()
    @Column({ type: "varchar", length: 36 })
    aggregateId: string;

    @Column({ type: "simple-json", nullable: true })
    payload: any;

    @Column({ type: "integer" })
    sequenceNumber: number;

    @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP", update: false })
    timestamp: Date;

    @Column({ type: "varchar", length: 255, nullable: true })
    tenantId?: string;

    @Column({ type: "varchar", length: 36, nullable: true })
    correlationId?: string;

    @Column({ type: "varchar", length: 36, nullable: true })
    triggeredByEventId?: string;

    @Column({ type: "varchar", length: 36, nullable: true })
    triggeredByUserId?: string;

    @Column({ type: "simple-json", nullable: true })
    metadata?: any;
}
