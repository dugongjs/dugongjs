import { DomainEvent } from "@dugongjs/core";
import { AbstractUserDomainEvent } from "./abstract-user-domain-event.js";

@DomainEvent()
export class UserDeletedEvent extends AbstractUserDomainEvent {
    public static readonly type = "UserDeleted";
}
