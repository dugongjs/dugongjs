import type { Constructor } from "../../types/constructor.type.js";
import type { AbstractDomainEvent } from "../abstract-domain-event/abstract-domain-event.js";
import { AggregateAlreadyRegisteredError } from "./errors/aggregate-already-registered.error.js";

type AggregateCommonMetadata = {
    type: string;
};

type AggregateInternalMetadata = {
    isInternal: true;
    origin?: never;
};

type AggregateExternalMetadata = {
    isInternal: false;
    origin: string;
};

export type AggregateMetadata = AggregateCommonMetadata & (AggregateInternalMetadata | AggregateExternalMetadata);

export type AggregateSnapshotMetadata = {
    snapshotInterval?: number;
};

export type AggregateDomainEventApplier = (event: InstanceType<typeof AbstractDomainEvent>) => void;

type AggregateDomainEventApplierMap = Map<Constructor, AggregateDomainEventApplier[]>;

class AggregateMetadataRegistry {
    private aggregateMetadataMap: Map<Constructor, AggregateMetadata> = new Map();
    private aggregateSnapshotMetadataMap: Map<Constructor, AggregateSnapshotMetadata> = new Map();
    private aggregateDomainEventAppliers: Map<Constructor, AggregateDomainEventApplierMap> = new Map();

    public registerAggregateMetadata(aggregateClass: Constructor, type: string): this {
        this.validateAggregateMetadata(aggregateClass);

        this.aggregateMetadataMap.set(aggregateClass, {
            isInternal: true,
            type
        });

        return this;
    }

    public registerExternalAggregateMetadata(aggregateClass: Constructor, type: string, origin: string): this {
        this.validateAggregateMetadata(aggregateClass);

        this.aggregateMetadataMap.set(aggregateClass, {
            isInternal: false,
            type,
            origin
        });

        return this;
    }

    public registerAggregateSnapshotMetadata(
        aggregateClass: Constructor,
        metadata: AggregateSnapshotMetadata = {}
    ): this {
        this.validateAggregateSnapshotMetadata(aggregateClass);

        this.aggregateSnapshotMetadataMap.set(aggregateClass, metadata);

        return this;
    }

    public registerAggregateDomainEventApplier(
        aggregateClass: Constructor,
        domainEventClass: Constructor,
        domainEventApplier: AggregateDomainEventApplier
    ): this {
        if (!this.aggregateDomainEventAppliers.has(aggregateClass)) {
            this.aggregateDomainEventAppliers.set(aggregateClass, new Map());
        }

        const domainEventApplierMap = this.aggregateDomainEventAppliers.get(aggregateClass)!;

        if (!domainEventApplierMap.has(domainEventClass)) {
            domainEventApplierMap.set(domainEventClass, []);
        }

        const domainEventAppliers = domainEventApplierMap.get(domainEventClass)!;

        domainEventAppliers.push(domainEventApplier);

        return this;
    }

    public getAggregateMetadata(aggregateClass: Constructor): AggregateMetadata | null {
        return this.aggregateMetadataMap.get(aggregateClass) ?? null;
    }

    public getAggregateSnapshotMetadata(aggregateClass: Constructor): AggregateSnapshotMetadata | null {
        return this.aggregateSnapshotMetadataMap.get(aggregateClass) ?? null;
    }

    public getAggregateDomainEventAppliers(
        aggregateClass: Constructor,
        domainEventClass: Constructor
    ): AggregateDomainEventApplier[] | null {
        const appliers: AggregateDomainEventApplier[] = [];

        let currentClass: Constructor | null = aggregateClass;

        while (currentClass) {
            const domainEventApplierMap = this.aggregateDomainEventAppliers.get(currentClass);

            if (domainEventApplierMap) {
                const handlers = domainEventApplierMap.get(domainEventClass);
                if (handlers) {
                    appliers.push(...handlers);
                }
            }
            currentClass = Object.getPrototypeOf(currentClass);
        }

        return appliers.length ? appliers : null;
    }

    public getAggregateClass(type: string, origin?: string): Constructor | null {
        for (const [aggregateClass, metadata] of this.aggregateMetadataMap.entries()) {
            if (metadata.type === type && metadata.origin === origin) {
                return aggregateClass;
            }
        }

        return null;
    }

    public getAggregateTypes(): string[] {
        return Array.from(this.aggregateMetadataMap.values()).map((metadata) => metadata.type);
    }

    public getAllAggregateMetadata(): Map<Constructor, AggregateMetadata> {
        return this.aggregateMetadataMap;
    }

    public clear(): void {
        this.aggregateMetadataMap.clear();
        this.aggregateSnapshotMetadataMap.clear();
        this.aggregateDomainEventAppliers.clear();
    }

    private validateAggregateMetadata(aggregateClass: Constructor): void {
        if (this.aggregateMetadataMap.has(aggregateClass)) {
            throw new AggregateAlreadyRegisteredError(aggregateClass.constructor.name);
        }
    }

    private validateAggregateSnapshotMetadata(aggregateClass: Constructor): void {
        if (this.aggregateSnapshotMetadataMap.has(aggregateClass)) {
            throw new AggregateAlreadyRegisteredError(aggregateClass.constructor.name);
        }
    }
}

export const aggregateMetadataRegistry = new AggregateMetadataRegistry();
