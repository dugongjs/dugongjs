import { Inject, Injectable } from "@nestjs/common";
import {
    IUserQueryModelRepository,
    type UserQueryModel
} from "../../ports/repository/i-user-query-model-repository.js";

@Injectable()
export class UserQueryService {
    constructor(@Inject(IUserQueryModelRepository) private readonly queryModelRepository: IUserQueryModelRepository) {}

    public async getUserById(userId: string): Promise<UserQueryModel | null> {
        return this.queryModelRepository.getQueryModelById(null, userId);
    }

    public async getAllUsers(): Promise<UserQueryModel[]> {
        return this.queryModelRepository.getAllQueryModels(null);
    }
}
