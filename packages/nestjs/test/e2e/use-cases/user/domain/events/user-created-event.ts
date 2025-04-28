import { DomainEvent } from "@dugongjs/core";
import { z } from "zod";
import { AbstractUserDomainEvent } from "./abstract-user-domain-event.js";

const payloadSchema = z.object({
    username: z.string(),
    email: z.string().email()
});

type Payload = z.infer<typeof payloadSchema>;

@DomainEvent()
export class UserCreatedEvent extends AbstractUserDomainEvent<Payload> {
    public static readonly type = "UserCreated";

    public onCreate(): void {
        this.validatePayload(payloadSchema);
    }
}
