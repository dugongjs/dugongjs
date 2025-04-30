import { Body, Controller, Delete, HttpCode, Param, Post, Put } from "@nestjs/common";
import { UserDto } from "../dtos/user.dto.js";
import { UserCommandService } from "./user.command.service.js";

@Controller("/users")
export class UserCommandController {
    constructor(private readonly userCommandService: UserCommandService) {}

    @Post()
    public async createUser(@Body("username") username: string, @Body("email") email: string): Promise<UserDto> {
        const user = await this.userCommandService.createUser({ username, email });

        return UserDto.fromAggregate(user);
    }

    @Put(":userId/update-email")
    public async updateEmail(@Param("userId") userId: string, @Body("email") email: string): Promise<UserDto> {
        const user = await this.userCommandService.updateEmail(userId, { email });

        return UserDto.fromAggregate(user);
    }

    @Put(":userId/update-username")
    public async updateUsername(@Param("userId") userId: string, @Body("username") username: string): Promise<UserDto> {
        const user = await this.userCommandService.updateUsername(userId, { username });

        return UserDto.fromAggregate(user);
    }

    @Delete(":userId")
    @HttpCode(204)
    public async deleteUser(@Param("userId") userId: string): Promise<UserDto> {
        const user = await this.userCommandService.deleteUser(userId);

        return UserDto.fromAggregate(user);
    }
}
