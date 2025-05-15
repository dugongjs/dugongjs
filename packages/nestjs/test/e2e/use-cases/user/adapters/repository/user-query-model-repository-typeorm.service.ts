import { Injectable, Optional } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { EntityManager, Repository } from "typeorm";
import type { User } from "../../domain/user.js";
import type {
    IUserQueryModelRepository,
    UserQueryModel
} from "../../ports/repository/i-user-query-model-repository.js";
import { UserQueryModelEntity } from "./user-query-model-entity.js";

@Injectable()
export class UserQueryModelRepositoryTypeOrmService implements IUserQueryModelRepository {
    constructor(
        @Optional()
        @InjectRepository(UserQueryModelEntity)
        private readonly userQueryModelRepository: Repository<UserQueryModelEntity>
    ) {}

    public async updateQueryModel(transactionContext: EntityManager | null, user: User): Promise<void> {
        const userQueryModelRepository =
            transactionContext?.getRepository(UserQueryModelEntity) ?? this.userQueryModelRepository;

        const userQueryModel = new UserQueryModelEntity();
        userQueryModel.id = user.getId();
        userQueryModel.username = user.getUsername();
        userQueryModel.email = user.getEmail();

        await userQueryModelRepository.save(userQueryModel);
    }

    public async deleteQueryModel(transactionContext: EntityManager | null, userId: string): Promise<void> {
        const userQueryModelRepository =
            transactionContext?.getRepository(UserQueryModelEntity) ?? this.userQueryModelRepository;

        await userQueryModelRepository.delete({ id: userId });
    }

    public async getQueryModelById(
        transactionContext: EntityManager | null,
        userId: string
    ): Promise<UserQueryModel | null> {
        const userQueryModelRepository =
            transactionContext?.getRepository(UserQueryModelEntity) ?? this.userQueryModelRepository;

        const userQueryModel = await userQueryModelRepository.findOne({
            where: { id: userId }
        });

        return userQueryModel;
    }

    public async getAllQueryModels(transactionContext: EntityManager | null): Promise<UserQueryModel[]> {
        const userQueryModelRepository =
            transactionContext?.getRepository(UserQueryModelEntity) ?? this.userQueryModelRepository;

        const userQueryModels = await userQueryModelRepository.find();

        return userQueryModels;
    }
}
