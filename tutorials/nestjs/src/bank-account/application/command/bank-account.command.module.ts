import { EventSourcingModule } from "@dugongjs/nestjs";
import { Module } from "@nestjs/common";
import { BankAccountCommandController } from "./bank-account.command.controller.js";
import { BankAccountCommandService } from "./bank-account.command.service.js";

@Module({
    imports: [EventSourcingModule],
    controllers: [BankAccountCommandController],
    providers: [BankAccountCommandService]
})
export class BankAccountCommandModule {}
