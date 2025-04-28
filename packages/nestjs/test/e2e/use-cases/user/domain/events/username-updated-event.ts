import { DomainEvent } from "@dugongjs/core";
import { z } from "zod";
import { AbstractUserDomainEvent } from "./abstract-user-domain-event.js";

const payloadSchema = z.object({
    username: z.string()
});

type Payload = z.infer<typeof payloadSchema>;

@DomainEvent()
export class UsernameUpdatedEvent extends AbstractUserDomainEvent<Payload> {
    public static readonly type = "UsernameUpdated";

    public onCreate(): void {
        this.validatePayload(payloadSchema);
    }
}
