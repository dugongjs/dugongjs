import { Module } from "@nestjs/common";
import { EventSourcingModule } from "../../../../../../src/event-sourcing/event-sourcing.module.js";
import { UserQueryController } from "./user.query.controller.js";
import { UserQueryService } from "./user.query.service.js";

@Module({
    imports: [EventSourcingModule],
    providers: [UserQueryService],
    controllers: [UserQueryController]
})
export class UserQueryModule {}
