import { AbstractDomainEvent, type DomainEventPayload } from "@dugongjs/core";

export abstract class AbstractAccountDomainEvent<
    TPayload extends DomainEventPayload | null = null
> extends AbstractDomainEvent<TPayload> {
    public readonly aggregateType = "Account";
    public readonly origin = "AccountService";
    public readonly version = 1;
}
