import { AbstractDomainEvent, type DomainEventPayload } from "@dugongjs/core";

export abstract class AbstractBankAccountDomainEvent<
    TPayload extends DomainEventPayload | null = null
> extends AbstractDomainEvent<TPayload> {
    public readonly origin = "BankingContext-AccountService";
    public readonly aggregateType = "BankAccount";
    public readonly version = 1;
}
