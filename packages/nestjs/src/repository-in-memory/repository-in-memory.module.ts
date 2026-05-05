import { IConsumedMessageRepository, IDomainEventRepository, ISnapshotRepository } from "@dugongjs/core";
import { Module, type DynamicModule } from "@nestjs/common";
import { ConsumedMessageRepositoryInMemoryService } from "./consumed-message-repository-in-memory.service.js";
import { DomainEventRepositoryInMemoryService } from "./domain-event-repository-in-memory.service.js";
import { SnapshotRepositoryInMemoryService } from "./snapshot-repository-in-memory.service.js";

@Module({
    providers: [
        {
            provide: IDomainEventRepository,
            useClass: DomainEventRepositoryInMemoryService
        },
        {
            provide: ISnapshotRepository,
            useClass: SnapshotRepositoryInMemoryService
        },
        {
            provide: IConsumedMessageRepository,
            useClass: ConsumedMessageRepositoryInMemoryService
        }
    ],
    exports: [IDomainEventRepository, ISnapshotRepository, IConsumedMessageRepository]
})
export class RepositoryInMemoryModule {
    public static forRoot(): DynamicModule {
        return {
            module: RepositoryInMemoryModule,
            global: true
        };
    }
}
