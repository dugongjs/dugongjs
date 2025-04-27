import type { SerializableObject } from "../../types/serializable-object.type.js";
import type { AbstractDomainEvent } from "./abstract-domain-event.js";

export type DomainEventClass<TPayload extends SerializableObject | null = null> = typeof AbstractDomainEvent<TPayload>;
