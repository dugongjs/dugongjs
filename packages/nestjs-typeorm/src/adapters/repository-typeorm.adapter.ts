import type { DugongAdapters } from "@dugongjs/nestjs";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConsumedMessageRepositoryTypeOrmService } from "../modules/repository-typeorm/consumed-message-repository-typeorm.service.js";
import { DomainEventRepositoryTypeOrmService } from "../modules/repository-typeorm/domain-event-repository-typeorm.service.js";
import { SnapshotRepositoryTypeOrmService } from "../modules/repository-typeorm/snapshot-repository-typeorm.service.js";
import type { TypeOrmEntities } from "../types/index.js";

export function createRepositoryTypeOrmAdapter(entities: TypeOrmEntities) {
    return {
        imports: [TypeOrmModule.forFeature([entities.domainEvent, entities.snapshot, entities.consumedMessage])],
        domainEventRepository: DomainEventRepositoryTypeOrmService,
        snapshotRepository: SnapshotRepositoryTypeOrmService,
        consumedMessageRepository: ConsumedMessageRepositoryTypeOrmService
    } satisfies DugongAdapters;
}
