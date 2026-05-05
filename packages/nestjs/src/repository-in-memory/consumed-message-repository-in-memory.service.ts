import { ConsumedMessageRepositoryInMemory } from "@dugongjs/core";
import { Injectable } from "@nestjs/common";

@Injectable()
export class ConsumedMessageRepositoryInMemoryService extends ConsumedMessageRepositoryInMemory {}
