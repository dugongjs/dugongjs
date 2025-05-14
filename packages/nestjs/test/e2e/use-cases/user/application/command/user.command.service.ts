import { Injectable } from "@nestjs/common";
import { EventSourcingService } from "../../../../../../src/event-sourcing/event-sourcing.service.js";
import type { CreateUserCommand } from "../../domain/commands/create-user-command.js";
import type { UpdateEmailCommand } from "../../domain/commands/update-email-command.js";
import type { UpdateUsernameCommand } from "../../domain/commands/update-username-command.js";
import { User } from "../../domain/user.js";

@Injectable()
export class UserCommandService {
    constructor(private readonly eventSourcingService: EventSourcingService) {}

    public async createUser(command: CreateUserCommand): Promise<User> {
        return this.eventSourcingService.transaction(async (transactionContext) => {
            const userContext = this.eventSourcingService.createAggregateContext(transactionContext, User);

            const user = new User();

            user.createUser(command);

            await userContext.applyAndCommitStagedDomainEvents(user);

            return user;
        });
    }

    public async updateEmail(userId: string, command: UpdateEmailCommand): Promise<User> {
        return this.eventSourcingService.transaction(async (transactionContext) => {
            const userContext = this.eventSourcingService.createAggregateContext(transactionContext, User);

            const user = await userContext.build(userId);

            if (!user) {
                throw new Error("User not found");
            }

            user.updateEmail(command);

            await userContext.applyAndCommitStagedDomainEvents(user);

            return user;
        });
    }

    public async updateUsername(userId: string, command: UpdateUsernameCommand): Promise<User> {
        return this.eventSourcingService.transaction(async (transactionContext) => {
            const userContext = this.eventSourcingService.createAggregateContext(transactionContext, User);

            const user = await userContext.build(userId);

            if (!user) {
                throw new Error("User not found");
            }

            user.updateUsername(command);

            await userContext.applyAndCommitStagedDomainEvents(user);

            return user;
        });
    }

    public async deleteUser(userId: string): Promise<User> {
        return this.eventSourcingService.transaction(async (transactionContext) => {
            const userContext = this.eventSourcingService.createAggregateContext(transactionContext, User);

            const user = await userContext.build(userId);

            if (!user) {
                throw new Error("User not found");
            }

            user.deleteUser();

            await userContext.applyAndCommitStagedDomainEvents(user);

            return user;
        });
    }
}
