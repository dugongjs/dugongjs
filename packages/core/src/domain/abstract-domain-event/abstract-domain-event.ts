import type { RemoveAbstract } from "../../types/remove-abstract.type.js";
import type { SerializableObject } from "../../types/serializable-object.type.js";
import type { ISerializedDomainEvent } from "./i-serialized-domain-event.js";

export type DomainEventPayload = SerializableObject | null;

/**
 * Abstract class representing a domain event.
 *
 * @template TPayload - The type of the payload. It can be a SerializableObject or null.
 */
export abstract class AbstractDomainEvent<TPayload extends DomainEventPayload = null> {
    public static readonly origin: string;
    public static readonly aggregateType: string;
    public static readonly type: string;
    public static readonly version: number;

    protected id: string;
    protected aggregateId: string;
    protected payload: TPayload;
    protected sequenceNumber: number;
    protected timestamp: Date;
    protected correlationId?: string;
    protected triggeredByEventId?: string;
    protected triggeredByUserId?: string;
    protected metadata?: SerializableObject;

    constructor(aggregateId: string, ...payload: TPayload extends null ? [] : [payload: TPayload]) {
        this.validateStaticProperties();

        this.aggregateId = aggregateId;
        this.payload = (payload[0] ?? null) as TPayload;
    }

    /**
     * Lifecycle method called when the event is created.
     */
    public onCreate?(): void;

    /**
     * Lifecycle method called when the event is staged.
     */
    public onStage?(): void;

    /**
     * Lifecycle method called when the event is committed.
     */
    public onCommit?(): void;

    /**
     * Lifecycle method called when the event is applied.
     */
    public onApply?(): void;

    public getOrigin(): string {
        return (this.constructor as typeof AbstractDomainEvent).origin;
    }

    public getAggregateType(): string {
        return (this.constructor as typeof AbstractDomainEvent).aggregateType;
    }

    public getType(): string {
        return (this.constructor as typeof AbstractDomainEvent).type;
    }

    public getVersion(): number {
        return (this.constructor as typeof AbstractDomainEvent).version;
    }

    public getId(): string {
        return this.id;
    }

    public getAggregateId(): string {
        return this.aggregateId;
    }

    public getPayload(): TPayload {
        return this.payload;
    }

    public getSequenceNumber(): number {
        return this.sequenceNumber;
    }

    public getTimestamp(): Date {
        return this.timestamp;
    }

    public getCorrelationId(): string | undefined {
        return this.correlationId;
    }

    public getTriggeredByEventId(): string | undefined {
        return this.triggeredByEventId;
    }

    public getTriggeredByUserId(): string | undefined {
        return this.triggeredByUserId;
    }

    public getMetadata(): SerializableObject | undefined {
        return this.metadata;
    }

    public setId(id: string): this {
        this.id = id;
        return this;
    }

    public setAggregateId(aggregateId: string): this {
        this.aggregateId = aggregateId;
        return this;
    }

    public setSequenceNumber(sequenceNumber: number): this {
        this.sequenceNumber = sequenceNumber;
        return this;
    }

    public setTimestamp(timestamp: Date): this {
        this.timestamp = timestamp;
        return this;
    }

    public setCorrelationId(correlationId: string): this {
        this.correlationId = correlationId;
        return this;
    }

    public setTriggeredByEventId(triggeredByEventId: string): this {
        this.triggeredByEventId = triggeredByEventId;
        return this;
    }

    public setTriggeredByUserId(triggeredByUserId: string): this {
        this.triggeredByUserId = triggeredByUserId;
        return this;
    }

    public setMetadata(metadata: SerializableObject): this {
        this.metadata = metadata;
        return this;
    }

    public serialize(): ISerializedDomainEvent {
        return {
            origin: this.getOrigin(),
            aggregateType: this.getAggregateType(),
            type: this.getType(),
            version: this.getVersion(),
            id: this.getId(),
            aggregateId: this.getAggregateId(),
            payload: this.getPayload(),
            sequenceNumber: this.getSequenceNumber(),
            timestamp: this.getTimestamp(),
            correlationId: this.getCorrelationId(),
            triggeredByEventId: this.getTriggeredByEventId(),
            triggeredByUserId: this.getTriggeredByUserId(),
            metadata: this.getMetadata()
        };
    }

    public static deserialize<TDomainEventClass extends new (...args: any) => AbstractDomainEvent<any>>(
        this: TDomainEventClass,
        serializedDomainEvent: ISerializedDomainEvent
    ): InstanceType<TDomainEventClass> {
        const instance = new (this as unknown as RemoveAbstract<TDomainEventClass>)(serializedDomainEvent.aggregateId);

        instance.id = serializedDomainEvent.id;
        instance.payload = serializedDomainEvent.payload as any;
        instance.sequenceNumber = serializedDomainEvent.sequenceNumber;
        instance.timestamp = serializedDomainEvent.timestamp;
        instance.correlationId = serializedDomainEvent.correlationId;
        instance.triggeredByEventId = serializedDomainEvent.triggeredByEventId;
        instance.triggeredByUserId = serializedDomainEvent.triggeredByUserId;
        instance.metadata = serializedDomainEvent.metadata;

        return instance as unknown as InstanceType<TDomainEventClass>;
    }

    private validateStaticProperties(): void {
        if (!this.getOrigin()) {
            throw new Error(`Missing static property 'origin' in ${this.constructor.name}`);
        }
        if (!this.getAggregateType()) {
            throw new Error(`Missing static property 'aggregateType' in ${this.constructor.name}`);
        }
        if (!this.getType()) {
            throw new Error(`Missing static property 'type' in ${this.constructor.name}`);
        }
        if (!this.getVersion()) {
            throw new Error(`Missing static property 'version' in ${this.constructor.name}`);
        }
    }
}
