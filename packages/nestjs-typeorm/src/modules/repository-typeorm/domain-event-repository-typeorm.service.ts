import { DomainEventEntity, DomainEventRepositoryTypeOrm } from "@dugongjs/typeorm";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { Repository } from "typeorm";

@Injectable()
export class DomainEventRepositoryTypeOrmService extends DomainEventRepositoryTypeOrm {
    constructor(@InjectRepository(DomainEventEntity) domainEventRepository: Repository<DomainEventEntity>) {
        super(domainEventRepository);
    }
}
