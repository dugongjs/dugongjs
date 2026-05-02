import { EventSourcingModule } from "@dugongjs/nestjs";
import { Module } from "@nestjs/common";
import { UserQueryController } from "./user.query.controller.js";
import { UserQueryService } from "./user.query.service.js";

@Module({
    imports: [EventSourcingModule],
    providers: [UserQueryService],
    controllers: [UserQueryController]
})
export class UserQueryModule {}
