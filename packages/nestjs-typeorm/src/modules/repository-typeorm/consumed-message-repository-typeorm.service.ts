import { ConsumedMessageEntity, ConsumedMessageRepositoryTypeOrm } from "@dugongjs/typeorm";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { Repository } from "typeorm";

@Injectable()
export class ConsumedMessageRepositoryTypeOrmService extends ConsumedMessageRepositoryTypeOrm {
    constructor(@InjectRepository(ConsumedMessageEntity) consumedMessageRepository: Repository<ConsumedMessageEntity>) {
        super(consumedMessageRepository);
    }
}
