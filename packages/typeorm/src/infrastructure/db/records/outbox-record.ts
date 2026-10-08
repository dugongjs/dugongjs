import type { SerializedDomainEvent } from "@dugongjs/core";

export type OutboxRecord = SerializedDomainEvent & {
    channelId: string;
};
