import type { DugongAdapters } from "@dugongjs/nestjs";
import { OutboxMessageMapperTypeOrm } from "@dugongjs/typeorm";
import { TypeOrmModule } from "@nestjs/typeorm";
import { OutboxMessageProducerTypeOrmService } from "../modules/outbox-message-producer-typeorm/outbox-message-producer-typeorm.service.js";
import type { TypeOrmEntities } from "../types/index.js";

export function createOutboxMessageProducerTypeOrmAdapter(entities: TypeOrmEntities) {
    return {
        imports: [TypeOrmModule.forFeature([entities.outbox])],
        messageProducer: OutboxMessageProducerTypeOrmService,
        outboundMessageMapper: OutboxMessageMapperTypeOrm
    } satisfies DugongAdapters;
}
