import type { DugongAdapters } from "../dugong/dugong-adapter.js";
import { ConsumedMessageRepositoryInMemoryService } from "../repository-in-memory/consumed-message-repository-in-memory.service.js";
import { DomainEventRepositoryInMemoryService } from "../repository-in-memory/domain-event-repository-in-memory.service.js";
import { SnapshotRepositoryInMemoryService } from "../repository-in-memory/snapshot-repository-in-memory.service.js";

export const repositoryInMemoryAdapter = {
    domainEventRepository: DomainEventRepositoryInMemoryService,
    snapshotRepository: SnapshotRepositoryInMemoryService,
    consumedMessageRepository: ConsumedMessageRepositoryInMemoryService
} satisfies DugongAdapters;
