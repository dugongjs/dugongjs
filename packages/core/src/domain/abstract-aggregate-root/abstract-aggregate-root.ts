import { Type } from "class-transformer";
import { v4 as uuid } from "uuid";
import type { SerializableObject } from "../../types/serializable-object.type.js";
import type { AbstractDomainEvent } from "../abstract-domain-event/abstract-domain-event.js";
import type { DomainEventClass } from "../abstract-domain-event/domain-event-class.js";
import { AbstractEventSourcedAggregateRoot } from "../abstract-event-sourced-aggregate-root/abstract-event-sourced-aggregate-root.js";
import { AggregateIdSetOutsideCreationContextError } from "./errors/aggregate-id-set-outside-creation-context.error.js";
import { MutateEventOutsideCommandContextError } from "./errors/mutate-event-outside-command-context.error.js";

export const IsInProcessContext = Symbol("IsInProcessContext");
export const IsInCreationContext = Symbol("IsInCreationContext");

export abstract class AbstractAggregateRoot extends AbstractEventSourcedAggregateRoot {
    private [IsInProcessContext]: boolean = false;
    private [IsInCreationContext]: boolean = false;

    @Type(() => Map)
    private readonly stagedEvents = new Map<number, InstanceType<DomainEventClass>>();

    /**
     * Gets the staged domain events.
     * @returns An array of staged domain events.
     */
    public getStagedDomainEvents(): AbstractDomainEvent[] {
        return Array.from(this.stagedEvents.values());
    }

    /**
     * Gets the staged domain events that have not been applied yet.
     * @returns An array of staged domain events that have not been applied yet.
     */
    public getStagedDomainEventsNotApplied(): AbstractDomainEvent[] {
        return this.getStagedDomainEvents().filter(
            (event) => event.getSequenceNumber() > this.getCurrentDomainEventSequenceNumber()
        );
    }

    /**
     * Creates a domain event with the aggregate ID of the current aggregate root.
     * Also sets the event ID and timestamp on the event.
     * @param domainEventClass The class of the domain event to create.
     * @param payload The payload for the domain event, if any.
     */
    public createDomainEvent<T extends AbstractDomainEvent>(domainEventClass: new (aggregateId: string) => T): T;
    public createDomainEvent<TPayload extends SerializableObject, T extends AbstractDomainEvent<TPayload>>(
        domainEventClass: new (aggregateId: string, payload: TPayload) => T,
        payload: TPayload
    ): T;
    public createDomainEvent(
        domainEventClass: new (...args: any[]) => AbstractDomainEvent,
        payload?: SerializableObject
    ): AbstractDomainEvent {
        this.validateCommandContext();

        if (!this.getId()) {
            this.validateCreationContext();
            this.setId(uuid());
        }

        const event = new domainEventClass(this.getId(), ...(payload !== undefined ? [payload] : []));

        event.setId(uuid()).setTimestamp(new Date());

        // Call the lifecycle method onCreate if it exists.
        event.onCreate?.();

        return event;
    }

    /**
     * Stages one or more domain events. The events are given a sequence number based on the current event sequence number.
     * The sequence number is incremented for each event staged.
     * @param domainEvents The domain events to stage.
     */
    public stageDomainEvent(...domainEvents: InstanceType<DomainEventClass<any>>[]): void {
        this.validateCommandContext();

        const highestStagedEventSequenceNumber = Math.max(...Array.from(this.stagedEvents.keys()), 0);
        let sequenceNumber = Math.max(this.getCurrentDomainEventSequenceNumber(), highestStagedEventSequenceNumber);

        for (const domainEvent of domainEvents) {
            domainEvent.setSequenceNumber(++sequenceNumber);

            this.stagedEvents.set(sequenceNumber, domainEvent);

            // Call the lifecycle method onStage if it exists.
            domainEvent.onStage?.();
        }
    }

    /**
     * Clears the staged domain events.
     */
    public clearStagedDomainEvents(): void {
        this.stagedEvents.clear();
    }

    private validateCommandContext(): void {
        if (!this[IsInProcessContext]) {
            throw new MutateEventOutsideCommandContextError();
        }
    }

    private validateCreationContext(): void {
        if (!this[IsInCreationContext]) {
            throw new AggregateIdSetOutsideCreationContextError();
        }
    }
}
