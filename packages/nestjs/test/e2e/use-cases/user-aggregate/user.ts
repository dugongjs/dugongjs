import { AbstractAggregateRoot, Aggregate, Apply, Process, Snapshotable } from "@dugongjs/core";
import type { CreateUserCommand } from "./commands/create-user-command.js";
import type { UpdateEmailCommand } from "./commands/update-email-command.js";
import type { UpdateUsernameCommand } from "./commands/update-username-command.js";
import { EmailUpdatedEvent } from "./events/email-updated-event.js";
import { UserCreatedEvent } from "./events/user-created-event.js";
import { UserDeletedEvent } from "./events/user-deleted-event.js";
import { UsernameUpdatedEvent } from "./events/username-updated-event.js";

@Aggregate("User")
@Snapshotable({ snapshotInterval: 10 })
export class User extends AbstractAggregateRoot {
    private username: string;
    private email: string;

    public getUsername(): string {
        return this.username;
    }

    public getEmail(): string {
        return this.email;
    }

    @Process({ isCreation: true })
    public createUser(command: CreateUserCommand): void {
        const event = this.createDomainEvent(UserCreatedEvent, {
            username: command.username,
            email: command.email
        });

        this.stageDomainEvent(event);
    }

    @Process()
    public updateUsername(command: UpdateUsernameCommand): void {
        this.username = command.username;

        const event = this.createDomainEvent(UsernameUpdatedEvent, {
            username: command.username
        });

        this.stageDomainEvent(event);
    }

    @Process()
    public updateEmail(command: UpdateEmailCommand): void {
        this.email = command.email;

        const event = this.createDomainEvent(EmailUpdatedEvent, {
            email: command.email
        });

        this.stageDomainEvent(event);
    }

    @Process()
    public deleteUser(): void {
        const event = this.createDomainEvent(UserDeletedEvent);

        this.stageDomainEvent(event);
    }

    @Apply(UserCreatedEvent)
    public applyUserCreatedEvent(event: UserCreatedEvent): void {
        const payload = event.getPayload();

        this.username = payload.username;
        this.email = payload.email;
    }

    @Apply(UsernameUpdatedEvent)
    public applyUsernameUpdatedEvent(event: UsernameUpdatedEvent): void {
        const payload = event.getPayload();

        this.username = payload.username;
    }

    @Apply(EmailUpdatedEvent)
    public applyEmailUpdatedEvent(event: EmailUpdatedEvent): void {
        const payload = event.getPayload();

        this.email = payload.email;
    }

    @Apply(UserDeletedEvent)
    public applyUserDeletedEvent(): void {
        this.delete();
    }
}
