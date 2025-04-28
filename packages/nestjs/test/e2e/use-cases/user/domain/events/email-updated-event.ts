import { DomainEvent } from "@dugongjs/core";
import { z } from "zod";
import { AbstractUserDomainEvent } from "./abstract-user-domain-event.js";

const payloadSchema = z.object({
    email: z.string().email()
});

type Payload = z.infer<typeof payloadSchema>;

@DomainEvent()
export class EmailUpdatedEvent extends AbstractUserDomainEvent<Payload> {
    public static readonly type = "EmailUpdated";

    public onCreate(): void {
        this.validatePayload(payloadSchema);
    }
}
