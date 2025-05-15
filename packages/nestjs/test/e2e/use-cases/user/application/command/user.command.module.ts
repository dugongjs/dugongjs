import { Module } from "@nestjs/common";
import {
    EventSourcingModule,
    type EventSourcingModuleOptions
} from "../../../../../../src/event-sourcing/event-sourcing.module.js";
import type { ModuleImports, ModuleProviders } from "../../../../../../src/providers/module-providers.js";
import { UserCommandController } from "./user.command.controller.js";
import { UserCommandService } from "./user.command.service.js";

export type UserCommandModuleOptions = {
    module?: ModuleImports & ModuleProviders;
    eventSourcingOptions?: EventSourcingModuleOptions;
};
@Module({
    imports: [EventSourcingModule],
    providers: [UserCommandService],
    controllers: [UserCommandController]
})
export class UserCommandModule {}
