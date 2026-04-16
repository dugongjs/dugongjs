import type { AbstractDomainEvent } from "./abstract-domain-event.js";
import type { SerializedDomainEvent } from "./serialized-domain-event.js";

export interface AbstractDomainEventStatics {
    readonly origin: string;
    readonly aggregateType: string;
    readonly type: string;
    readonly version: number;
    deserialize<TDomainEventClass extends new (...args: any[]) => AbstractDomainEvent<any>>(
        this: TDomainEventClass,
        serializedDomainEvent: SerializedDomainEvent
    ): InstanceType<TDomainEventClass>;
}
