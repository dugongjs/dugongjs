import { IConsumedMessageRepository, IDomainEventRepository, ISnapshotRepository } from "@dugongjs/core";
import { ConsumedMessageEntity, DomainEventEntity, SnapshotEntity } from "@dugongjs/typeorm";
import { Module, type DynamicModule } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConsumedMessageRepositoryTypeOrmService } from "./consumed-message-repository-typeorm.service.js";
import { DomainEventRepositoryTypeOrmService } from "./domain-event-repository-typeorm.service.js";
import { SnapshotRepositoryTypeOrmService } from "./snapshot-repository-typeorm.service.js";

@Module({
    imports: [TypeOrmModule.forFeature([DomainEventEntity, SnapshotEntity, ConsumedMessageEntity])],
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
export class RepositoryTypeOrmModule {
    public static forRoot(): DynamicModule {
        return {
            module: RepositoryTypeOrmModule,
            global: true
        };
    }
}
