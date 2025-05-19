import { DomainEvent } from "@dugongjs/core";
import { AbstractBankAccountDomainEvent } from "./abstract-bank-account-domain-event.js";

@DomainEvent()
export class AccountClosedEvent extends AbstractBankAccountDomainEvent {
    public readonly type = "AccountClosed";
}
