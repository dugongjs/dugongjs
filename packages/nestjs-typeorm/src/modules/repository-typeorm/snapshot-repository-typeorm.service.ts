import { SnapshotEntity, SnapshotRepositoryTypeOrm } from "@dugongjs/typeorm";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { Repository } from "typeorm";

@Injectable()
export class SnapshotRepositoryTypeOrmService extends SnapshotRepositoryTypeOrm {
    constructor(@InjectRepository(SnapshotEntity) snapshotRepository: Repository<SnapshotEntity>) {
        super(snapshotRepository);
    }
}
