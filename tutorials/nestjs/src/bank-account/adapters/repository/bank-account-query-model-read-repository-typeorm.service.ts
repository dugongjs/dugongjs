import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BankAccountQueryModel } from "../../ports/repository/bank-account-query-model.js";
import { IBankAccountQueryModelReadRepository } from "../../ports/repository/i-bank-account-query-model-read-repository.js";
import { BankAccountQueryModelEntity } from "./bank-account-query-model.entity.js";

export class BankAccountQueryModelReadRepositoryTypeOrmService implements IBankAccountQueryModelReadRepository {
    constructor(
        @InjectRepository(BankAccountQueryModelEntity)
        private readonly bankAccountQueryModelRepository: Repository<BankAccountQueryModelEntity>
    ) {}

    public async findById(id: string): Promise<BankAccountQueryModel | null> {
        return this.bankAccountQueryModelRepository.findOne({
            where: { id }
        });
    }

    public async findAll(): Promise<BankAccountQueryModel[]> {
        return this.bankAccountQueryModelRepository.find();
    }
}
