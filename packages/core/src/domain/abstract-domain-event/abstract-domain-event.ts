import type { RemoveAbstract } from "../../types/remove-abstract.type.js";
import type { SerializableObject } from "../../types/serializable-object.type.js";
import type { SerializedDomainEvent } from "./serialized-domain-event.js";

export type DomainEventPayload = SerializableObject | null;

/**
 * Abstract class representing a domain event.
 *
 * @template TPayload - The type of the payload. It can be a SerializableObject or null.
 */
export abstract class AbstractDomainEvent<TPayload extends DomainEventPayload = null> {
    public abstract readonly origin: string;
    public abstract readonly aggregateType: string;
    public abstract readonly type: string;
    public abstract readonly version: number;

    protected id: string;
    protected aggregateId: string;
    protected payload: TPayload;
    protected sequenceNumber: number;
    protected timestamp: Date;
    protected tenantId?: string;
    protected correlationId?: string;
    protected triggeredByEventId?: string;
    protected triggeredByUserId?: string;
    protected metadata?: SerializableObject;

    constructor(aggregateId: string, ...payload: TPayload extends null ? [] : [payload: TPayload]) {
        this.aggregateId = aggregateId;
        this.payload = (payload[0] ?? null) as TPayload;
    }

    public static get origin(): string {
        return new (this as any)().origin;
    }

    public static get aggregateType(): string {
        return new (this as any)().aggregateType;
    }

    public static get type(): string {
        return new (this as any)().type;
    }

    public static get version(): number {
        return new (this as any)().version;
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
        return this.origin;
    }

    public getAggregateType(): string {
        return this.aggregateType;
    }

    public getType(): string {
        return this.type;
    }

    public getVersion(): number {
        return this.version;
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

    public getTenantId(): string | undefined {
        return this.tenantId;
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

    public setTenantId(tenantId: string | undefined): this {
        this.tenantId = tenantId;
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

    public serialize(): SerializedDomainEvent {
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
            tenantId: this.getTenantId(),
            correlationId: this.getCorrelationId(),
            triggeredByEventId: this.getTriggeredByEventId(),
            triggeredByUserId: this.getTriggeredByUserId(),
            metadata: this.getMetadata()
        };
    }

    public static deserialize<TDomainEventClass extends new (...args: any) => AbstractDomainEvent<any>>(
        this: TDomainEventClass,
        serializedDomainEvent: SerializedDomainEvent
    ): InstanceType<TDomainEventClass> {
        const instance = new (this as unknown as RemoveAbstract<TDomainEventClass>)(serializedDomainEvent.aggregateId);

        instance.id = serializedDomainEvent.id;
        instance.payload = serializedDomainEvent.payload as any;
        instance.sequenceNumber = serializedDomainEvent.sequenceNumber;
        instance.timestamp = serializedDomainEvent.timestamp;
        instance.tenantId = serializedDomainEvent.tenantId;
        instance.correlationId = serializedDomainEvent.correlationId;
        instance.triggeredByEventId = serializedDomainEvent.triggeredByEventId;
        instance.triggeredByUserId = serializedDomainEvent.triggeredByUserId;
        instance.metadata = serializedDomainEvent.metadata;

        return instance as unknown as InstanceType<TDomainEventClass>;
    }
}
