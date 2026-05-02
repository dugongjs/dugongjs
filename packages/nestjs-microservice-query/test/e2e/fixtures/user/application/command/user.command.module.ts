import { EventSourcingModule } from "@dugongjs/nestjs";
import { Module } from "@nestjs/common";
import { UserCommandController } from "./user.command.controller.js";
import { UserCommandService } from "./user.command.service.js";

@Module({
    imports: [EventSourcingModule],
    providers: [UserCommandService],
    controllers: [UserCommandController]
})
export class UserCommandModule {}
