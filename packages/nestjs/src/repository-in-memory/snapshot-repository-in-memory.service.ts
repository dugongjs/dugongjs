import { SnapshotRepositoryInMemory } from "@dugongjs/core";
import { Injectable } from "@nestjs/common";

@Injectable()
export class SnapshotRepositoryInMemoryService extends SnapshotRepositoryInMemory {}
