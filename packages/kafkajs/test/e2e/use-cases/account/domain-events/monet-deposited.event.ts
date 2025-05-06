import { DomainEvent } from "@dugongjs/core";
import { AbstractAccountDomainEvent } from "./abstract-account-domain-event.js";

@DomainEvent()
export class MoneyDepositedEvent extends AbstractAccountDomainEvent<{ amount: number }> {
    public static readonly type = "MoneyDeposited";
}
