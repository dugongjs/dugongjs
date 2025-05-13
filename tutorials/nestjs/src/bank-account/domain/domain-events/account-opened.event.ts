import { DomainEvent } from "@dugongjs/core";
import { AbstractBankAccountDomainEvent } from "./abstract-bank-account-domain-event.js";

@DomainEvent()
export class AccountOpenedEvent extends AbstractBankAccountDomainEvent<{ owner: string; initialBalance: number }> {
    public static readonly type = "AccountOpened";
}
