import { DomainEvent } from "@dugongjs/core";
import { AbstractAccountDomainEvent } from "./abstract-account-domain-event.js";

@DomainEvent()
export class MoneyWithdrawnEvent extends AbstractAccountDomainEvent<{ amount: number }> {
    public readonly type = "MoneyWithdrawn";
}
