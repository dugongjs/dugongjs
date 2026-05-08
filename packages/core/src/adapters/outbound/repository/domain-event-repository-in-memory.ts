import type { SerializedDomainEvent } from "../../../domain/abstract-domain-event/serialized-domain-event.js";
import type { TransactionContext } from "../../../ports/index.js";
import type { IDomainEventRepository } from "../../../ports/outbound/repository/i-domain-event-repository.js";
import {
    getInMemoryTransactionContext,
    getTransactionalStore,
    type InMemoryTransactionContext
} from "../transaction-manager/in-memory-transaction-context.js";

function normalizeTenantId(tenantId?: string | null): string | null {
    return tenantId ?? null;
}

export class DomainEventRepositoryInMemory implements IDomainEventRepository {
    private domainEvents: SerializedDomainEvent[] = [];
    private readonly storeKey = Symbol("DomainEventRepositoryInMemory");

    public async getAggregateDomainEvents(
        transactionContext: TransactionContext | null,
        origin: string,
        aggregateType: string,
        aggregateId: string,
        tenantId?: string | null,
        fromSequenceNumber?: number
    ): Promise<SerializedDomainEvent[]> {
        const inMemoryTransactionContext = getInMemoryTransactionContext(transactionContext);
        const normalizedTenantId = normalizeTenantId(tenantId);

        const domainEvents = this.getDomainEventsStore(inMemoryTransactionContext)
            .filter((domainEvent) => {
                if (
                    domainEvent.origin !== origin ||
                    domainEvent.aggregateType !== aggregateType ||
                    domainEvent.aggregateId !== aggregateId
                ) {
                    return false;
                }

                return normalizeTenantId(domainEvent.tenantId) === normalizedTenantId;
            })
            .sort((eventA, eventB) => eventA.sequenceNumber - eventB.sequenceNumber)
            .filter((domainEvent) => {
                if (fromSequenceNumber === undefined) {
                    return true;
                }

                return domainEvent.sequenceNumber >= fromSequenceNumber;
            });

        return structuredClone(domainEvents);
    }

    public async getAggregateIds(
        transactionContext: TransactionContext | null,
        origin: string,
        aggregateType: string,
        tenantId?: string | null
    ): Promise<string[]> {
        const inMemoryTransactionContext = getInMemoryTransactionContext(transactionContext);
        const normalizedTenantId = normalizeTenantId(tenantId);

        const aggregateIds = new Set(
            this.getDomainEventsStore(inMemoryTransactionContext)
                .filter((domainEvent) => {
                    if (domainEvent.origin !== origin || domainEvent.aggregateType !== aggregateType) {
                        return false;
                    }

                    return normalizeTenantId(domainEvent.tenantId) === normalizedTenantId;
                })
                .map((domainEvent) => domainEvent.aggregateId)
        );

        return [...aggregateIds].sort((aggregateIdA, aggregateIdB) => aggregateIdA.localeCompare(aggregateIdB));
    }

    public async saveDomainEvents(
        transactionContext: TransactionContext | null,
        events: SerializedDomainEvent[]
    ): Promise<void> {
        const inMemoryTransactionContext = getInMemoryTransactionContext(transactionContext);
        const store = this.getDomainEventsStore(inMemoryTransactionContext);

        for (const event of events) {
            const existingEventWithId = store.find((domainEvent) => domainEvent.id === event.id);

            if (existingEventWithId) {
                continue;
            }

            const existingEventWithSequenceNumber = store.find(
                (domainEvent) =>
                    domainEvent.origin === event.origin &&
                    domainEvent.aggregateType === event.aggregateType &&
                    domainEvent.aggregateId === event.aggregateId &&
                    normalizeTenantId(domainEvent.tenantId) === normalizeTenantId(event.tenantId) &&
                    domainEvent.sequenceNumber === event.sequenceNumber
            );

            if (existingEventWithSequenceNumber) {
                throw new Error(
                    "Domain event conflict: duplicate [origin, aggregateType, aggregateId, tenantId, sequenceNumber]"
                );
            }

            store.push(structuredClone(event));
        }
    }

    private getDomainEventsStore(transactionContext: InMemoryTransactionContext | null): SerializedDomainEvent[] {
        return getTransactionalStore(
            transactionContext,
            this.storeKey,
            () => this.domainEvents,
            (domainEvents) => {
                this.domainEvents = domainEvents;
            }
        );
    }
}
