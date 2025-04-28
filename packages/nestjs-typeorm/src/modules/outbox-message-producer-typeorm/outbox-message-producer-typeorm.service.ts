import { OutboxEntity, OutboxMessageProducerTypeOrm } from "@dugongjs/typeorm";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { Repository } from "typeorm";

@Injectable()
export class OutboxMessageProducerTypeOrmService extends OutboxMessageProducerTypeOrm {
    constructor(@InjectRepository(OutboxEntity) outboxRepository: Repository<OutboxEntity>) {
        super(outboxRepository);
    }
}
