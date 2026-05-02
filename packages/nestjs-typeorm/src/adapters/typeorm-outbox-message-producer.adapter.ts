import type { DugongAdapters } from "@dugongjs/nestjs";
import { OutboxEntity, OutboxMessageMapperTypeOrm } from "@dugongjs/typeorm";
import { TypeOrmModule } from "@nestjs/typeorm";
import { OutboxMessageProducerTypeOrmService } from "../modules/outbox-message-producer-typeorm/outbox-message-producer-typeorm.service.js";

export const typeOrmOutboxMessageProducerAdapter = {
    imports: [TypeOrmModule.forFeature([OutboxEntity])],
    messageProducer: OutboxMessageProducerTypeOrmService,
    outboundMessageMapper: OutboxMessageMapperTypeOrm
} satisfies DugongAdapters;
