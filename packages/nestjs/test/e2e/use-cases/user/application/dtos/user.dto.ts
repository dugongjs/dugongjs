import type { User } from "../../domain/user.js";
import type { UserQueryModel } from "../../ports/repository/i-user-query-model-repository.js";

export class UserDto {
    id: string;
    username: string;
    email: string;

    public static fromAggregate(aggregate: User): UserDto {
        const dto = new UserDto();
        dto.id = aggregate.getId();
        dto.username = aggregate.getUsername();
        dto.email = aggregate.getEmail();
        return dto;
    }

    public static fromQueryModel(queryModel: UserQueryModel): UserDto {
        const dto = new UserDto();
        dto.id = queryModel.id;
        dto.username = queryModel.username;
        dto.email = queryModel.email;
        return dto;
    }
}
