import { IConsumedMessageRepository, IDomainEventRepository, ISnapshotRepository } from "@dugongjs/core";
import { Module, type DynamicModule } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import type { TypeOrmEntities, TypeOrmFeatureModule } from "../../types/index.js";
import { ConsumedMessageRepositoryTypeOrmService } from "./consumed-message-repository-typeorm.service.js";
import { DomainEventRepositoryTypeOrmService } from "./domain-event-repository-typeorm.service.js";
import { SnapshotRepositoryTypeOrmService } from "./snapshot-repository-typeorm.service.js";

export function createRepositoryTypeOrmModule(entities: TypeOrmEntities): TypeOrmFeatureModule {
    @Module({
        imports: [TypeOrmModule.forFeature([entities.domainEvent, entities.snapshot, entities.consumedMessage])],
        providers: [
            {
                provide: IDomainEventRepository,
                useClass: DomainEventRepositoryTypeOrmService
            },
            {
                provide: ISnapshotRepository,
                useClass: SnapshotRepositoryTypeOrmService
            },
            {
                provide: IConsumedMessageRepository,
                useClass: ConsumedMessageRepositoryTypeOrmService
            }
        ],
        exports: [IDomainEventRepository, ISnapshotRepository, IConsumedMessageRepository]
    })
    class RepositoryTypeOrmModule {
        public static forRoot(): DynamicModule {
            return {
                module: RepositoryTypeOrmModule,
                global: true
            };
        }
    }

    return RepositoryTypeOrmModule;
}
