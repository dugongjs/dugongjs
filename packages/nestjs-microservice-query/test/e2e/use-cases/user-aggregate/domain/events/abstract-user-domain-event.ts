import { AbstractDomainEvent, type DomainEventPayload } from "@dugongjs/core";
import type { z } from "zod";

export abstract class AbstractUserDomainEvent<
    TPayload extends DomainEventPayload | null = null
> extends AbstractDomainEvent<TPayload> {
    static readonly origin = "IAM-UserService";
    static readonly aggregateType = "User";
    static readonly version = 1;

    protected validatePayload(payloadSchema: z.ZodType<TPayload>): void {
        const validationResult = payloadSchema.safeParse(this.payload);

        if (!validationResult.success) {
            throw new Error(`Invalid payload: ${validationResult.error}`);
        }
    }
}
