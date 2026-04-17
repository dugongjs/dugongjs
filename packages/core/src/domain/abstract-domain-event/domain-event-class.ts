import type { SerializableObject } from "../../types/serializable-object.type.js";
import type { AbstractDomainEventStatics } from "./abstract-domain-event-statics.js";
import type { AbstractDomainEvent } from "./abstract-domain-event.js";

export type DomainEventClass<TPayload extends SerializableObject | null = any> = (abstract new (
    aggregateId: string,
    ...args: any[]
) => AbstractDomainEvent<TPayload>) &
    AbstractDomainEventStatics;
