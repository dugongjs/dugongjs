import type { DugongAdapters } from "@dugongjs/nestjs";
import { ConsumedMessageEntity, DomainEventEntity, SnapshotEntity } from "@dugongjs/typeorm";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConsumedMessageRepositoryTypeOrmService } from "../modules/repository-typeorm/consumed-message-repository-typeorm.service.js";
import { DomainEventRepositoryTypeOrmService } from "../modules/repository-typeorm/domain-event-repository-typeorm.service.js";
import { SnapshotRepositoryTypeOrmService } from "../modules/repository-typeorm/snapshot-repository-typeorm.service.js";

export const typeOrmRepositoryAdapter = {
    imports: [TypeOrmModule.forFeature([DomainEventEntity, SnapshotEntity, ConsumedMessageEntity])],
    domainEventRepository: DomainEventRepositoryTypeOrmService,
    snapshotRepository: SnapshotRepositoryTypeOrmService,
    consumedMessageRepository: ConsumedMessageRepositoryTypeOrmService
} satisfies DugongAdapters;
