import type { User } from "../../domain/user.js";

export class UserDto {
    id: string;
    username: string;
    email: string;

    static fromAggregate(aggregate: User): UserDto {
        const dto = new UserDto();
        dto.id = aggregate.getId();
        dto.username = aggregate.getUsername();
        dto.email = aggregate.getEmail();
        return dto;
    }
}
