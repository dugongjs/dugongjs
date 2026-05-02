import { DomainEvent } from "@dugongjs/core";
import { AbstractAccountDomainEvent } from "./abstract-account-domain-event.js";

@DomainEvent()
export class AccountOpenedEvent extends AbstractAccountDomainEvent<{ owner: string; initialAmount: number }> {
    public readonly type = "AccountOpened";
}
