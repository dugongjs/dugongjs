import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { UserDto } from "../dtos/user.dto.js";
import { UserQueryService } from "./user.query.service.js";

@Controller("users")
export class UserQueryController {
    constructor(private readonly userQueryService: UserQueryService) {}

    @Get(":userId")
    public async getUser(@Param("userId") userId: string): Promise<UserDto> {
        const user = await this.userQueryService.getUser(userId);

        if (!user) {
            throw new NotFoundException(`User with ID ${userId} not found`);
        }

        return UserDto.fromAggregate(user);
    }
}
