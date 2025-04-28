import { Column, Entity } from "typeorm";
import { DomainEventEntity } from "./domain-event.entity.js";

@Entity("outbox")
export class OutboxEntity extends DomainEventEntity {
    @Column({ type: "varchar", length: 255 })
    channelId: string;
}
