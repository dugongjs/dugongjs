import { AbstractAggregateRoot } from "../../../src/domain/abstract-aggregate-root/abstract-aggregate-root.js";
import {
    AbstractDomainEvent,
    type DomainEventPayload
} from "../../../src/domain/abstract-domain-event/abstract-domain-event.js";
import { Aggregate } from "../../../src/domain/aggregate-decorators/aggregate.js";
import { Apply } from "../../../src/domain/aggregate-decorators/apply.js";
import { Process } from "../../../src/domain/aggregate-decorators/process.js";
import { Snapshotable } from "../../../src/domain/aggregate-decorators/snapshotable.js";
import { DomainEvent } from "../../../src/domain/domain-event-decorators/domain-event.js";

abstract class AbstractUserDomainEvent<
    TPayload extends DomainEventPayload = null
> extends AbstractDomainEvent<TPayload> {
    public readonly origin = "IAM.UserService";
    public readonly aggregateType = "User";

    protected static validateUsername(username: string): void {
        if (username.length < 3) {
            throw new Error("Username must be at least 3 characters long.");
        }
        if (username.length > 20) {
            throw new Error("Username must be at most 20 characters long.");
        }
    }
}

@DomainEvent()
export class UserCreatedEvent extends AbstractUserDomainEvent<{ username: string }> {
    public readonly type = "UserCreated";
    public readonly version = 1;

    constructor(aggregateId: string, payload: { username: string }) {
        super(aggregateId, payload);
    }

    public onCreate(): void {
        UserCreatedEvent.validateUsername(this.payload.username);
    }
}

@DomainEvent()
export class UserUpdatedEvent extends AbstractUserDomainEvent<{ username: string }> {
    public readonly type = "UserUpdated";
    public readonly version = 1;

    constructor(aggregateId: string, payload: { username: string }) {
        super(aggregateId, payload);
    }

    public onCreate(): void {
        UserUpdatedEvent.validateUsername(this.payload.username);
    }
}

@DomainEvent()
export class UserDeletedEvent extends AbstractUserDomainEvent {
    public readonly type = "UserDeleted";
    public readonly version = 1;

    constructor(aggregateId: string) {
        super(aggregateId);
    }
}

@Aggregate("User")
@Snapshotable()
export class UserAggregate extends AbstractAggregateRoot {
    private username: string | null = null;

    public getUsername(): string | null {
        return this.username;
    }

    @Process({ isCreation: true })
    public createUser(username: string): void {
        const event = this.createDomainEvent(UserCreatedEvent, { username });
        this.stageDomainEvent(event);
    }

    @Process()
    public updateUser(username: string): void {
        const event = this.createDomainEvent(UserUpdatedEvent, { username });
        this.stageDomainEvent(event);
    }

    @Process()
    public deleteUser(): void {
        const event = this.createDomainEvent(UserDeletedEvent);
        this.stageDomainEvent(event);
    }

    @Apply(UserCreatedEvent)
    public applyUserCreated(event: UserCreatedEvent): void {
        this.username = event.getPayload().username;
    }

    @Apply(UserUpdatedEvent)
    public applyUserUpdated(event: UserUpdatedEvent): void {
        this.username = event.getPayload().username;
    }

    @Apply(UserDeletedEvent)
    public applyUserDeleted(): void {
        this.delete();
    }
}
