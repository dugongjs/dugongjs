import { AbstractDomainEvent, type DomainEventPayload } from "@dugongjs/core";

export abstract class AbstractAccountDomainEvent<
    TPayload extends DomainEventPayload | null = null
> extends AbstractDomainEvent<TPayload> {
    public static readonly aggregateType = "Account";
    public static readonly origin = "AccountService";
    public static readonly version = 1;
}
