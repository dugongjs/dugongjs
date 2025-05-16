import { AbstractDomainEvent, type DomainEventPayload } from "@dugongjs/core";
import type { z } from "zod";

export abstract class AbstractUserDomainEvent<
    TPayload extends DomainEventPayload | null = null
> extends AbstractDomainEvent<TPayload> {
    public readonly origin = "IAM-UserService";
    public readonly aggregateType = "User";
    public readonly version = 1;

    protected validatePayload(payloadSchema: z.ZodType<TPayload>): void {
        const validationResult = payloadSchema.safeParse(this.payload);

        if (!validationResult.success) {
            throw new Error(`Invalid payload: ${validationResult.error}`);
        }
    }
}
