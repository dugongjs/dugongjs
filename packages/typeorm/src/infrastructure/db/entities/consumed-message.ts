import { Column, Entity, PrimaryGeneratedColumn, Unique } from "typeorm";

@Entity("consumed_messages")
@Unique(["domainEventId", "consumerId", "tenantId"])
export class ConsumedMessageEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "uuid" })
    domainEventId: string;

    @Column({ type: "varchar", length: 255 })
    consumerId: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    tenantId?: string;
}
