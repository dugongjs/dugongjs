import { DomainEventRepositoryInMemory } from "@dugongjs/core";
import { Injectable } from "@nestjs/common";

@Injectable()
export class DomainEventRepositoryInMemoryService extends DomainEventRepositoryInMemory {}
