import { AbstractDomainEvent, type DomainEventPayload } from "@dugongjs/core";

export abstract class AbstractBankAccountDomainEvent<
    TPayload extends DomainEventPayload | null = null
> extends AbstractDomainEvent<TPayload> {
    public static readonly origin = "BankingContext-AccountService";
    public static readonly aggregateType = "BankAccount";
    public static readonly version = 1;
}
