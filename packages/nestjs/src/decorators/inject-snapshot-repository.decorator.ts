import { ISnapshotRepository } from "@dugongjs/core";
import { Inject } from "@nestjs/common";

export const InjectSnapshotRepository = () => Inject(ISnapshotRepository);
