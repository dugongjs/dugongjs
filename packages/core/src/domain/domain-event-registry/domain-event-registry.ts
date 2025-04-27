import type { DomainEventClass } from "../abstract-domain-event/domain-event-class.js";
import { DomainEventAlreadyRegisteredError } from "./errors/domain-event-already-registered.error.js";

type DomainEventOrigin = string;
type DomainEventAggregateType = string;
type DomainEventType = string;
type DomainEventVersion = number;
type DomainEventRegistryKey = `${DomainEventType}:${DomainEventVersion}`;
type DomainEventRegistryMap = Map<
    DomainEventOrigin,
    Map<DomainEventAggregateType, Map<DomainEventRegistryKey, DomainEventClass>>
>;

class DomainEventRegistry {
    private readonly registry: DomainEventRegistryMap = new Map();

    public register(eventClass: DomainEventClass): this {
        const origin = eventClass.origin;
        const aggregateType = eventClass.aggregateType;
        const type = eventClass.type;
        const version = eventClass.version;

        if (!this.registry.has(origin)) {
            this.registry.set(origin, new Map());
        }

        const originMap = this.registry.get(origin)!;

        if (!originMap.has(aggregateType)) {
            originMap.set(aggregateType, new Map());
        }

        const aggregateTypeMap = originMap.get(aggregateType)!;

        const key: DomainEventRegistryKey = `${type}:${version}`;

        if (aggregateTypeMap.has(key)) {
            throw new DomainEventAlreadyRegisteredError(origin, aggregateType, type, version);
        }

        aggregateTypeMap.set(key, eventClass);

        return this;
    }

    public getDomainEventClass(
        origin: DomainEventOrigin,
        aggregateType: DomainEventAggregateType,
        type: DomainEventType,
        version: DomainEventVersion
    ): DomainEventClass | null {
        const originMap = this.registry.get(origin);
        if (!originMap) {
            return null;
        }

        const aggregateTypeMap = originMap.get(aggregateType);
        if (!aggregateTypeMap) {
            return null;
        }

        const key: DomainEventRegistryKey = `${type}:${version}`;
        return aggregateTypeMap.get(key) ?? null;
    }

    public clear(): void {
        this.registry.clear();
    }

    public getAllRegisteredEvents(): DomainEventClass[] {
        const events: DomainEventClass[] = [];
        this.registry.forEach((originMap) => {
            originMap.forEach((aggregateTypeMap) => {
                aggregateTypeMap.forEach((eventClass) => {
                    events.push(eventClass);
                });
            });
        });
        return events;
    }
}

export const domainEventRegistry = new DomainEventRegistry();
