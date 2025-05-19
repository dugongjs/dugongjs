import { DomainEvent } from "@dugongjs/core";
import { AbstractBankAccountDomainEvent } from "./abstract-bank-account-domain-event.js";

@DomainEvent()
export class MoneyWithdrawnEvent extends AbstractBankAccountDomainEvent<{ amount: number }> {
    public readonly type = "MoneyWithdrawn";
}
