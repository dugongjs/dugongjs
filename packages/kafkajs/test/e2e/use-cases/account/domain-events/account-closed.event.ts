import { DomainEvent } from "@dugongjs/core";
import { AbstractAccountDomainEvent } from "./abstract-account-domain-event.js";

@DomainEvent()
export class AccountClosedEvent extends AbstractAccountDomainEvent {
    public static readonly type = "AccountClosed";
}
