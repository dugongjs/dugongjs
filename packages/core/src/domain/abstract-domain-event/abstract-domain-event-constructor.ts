import type { AbstractDomainEventStatics } from "./abstract-domain-event-statics.js";
import type { AbstractDomainEvent, DomainEventPayload } from "./abstract-domain-event.js";

/**
 * Constructor type for schema-based domain events created via AbstractDomainEvent.fromSchema().
 * The instance type includes validatePayload() which validates and transforms the payload using the schema.
 */
export type AbstractDomainEventConstructor<TInputPayload, TOutputPayload extends DomainEventPayload> = (abstract new (
    aggregateId: string,
    ...payload: TInputPayload extends null ? [] : [payload: TInputPayload]
) => AbstractDomainEvent<TOutputPayload> & {
    /**
     * Validates and transforms the payload using the schema.
     * This method is called automatically by the aggregate when creating the event.
     */
    validatePayload(): Promise<void>;
}) &
    AbstractDomainEventStatics;
