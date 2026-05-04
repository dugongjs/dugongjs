import type { TransactionContext } from "../../../ports/index.js";
import type { IConsumedMessageRepository } from "../../../ports/outbound/repository/i-consumed-message-repository.js";
import {
    getInMemoryTransactionContext,
    getTransactionalStore,
    type InMemoryTransactionContext
} from "../transaction-manager/in-memory-transaction-context.js";

function toConsumedMessageKey(domainEventId: string, consumerId: string, tenantId?: string | null): string {
    return `${domainEventId}::${consumerId}::${tenantId ?? ""}`;
}

export class ConsumedMessageRepositoryInMemory implements IConsumedMessageRepository {
    private consumedMessageKeys = new Set<string>();
    private readonly storeKey = Symbol("ConsumedMessageRepositoryInMemory");

    public async checkIfMessageIsConsumed(
        transactionContext: TransactionContext | null,
        domainEventId: string,
        consumerId: string,
        tenantId?: string | null
    ): Promise<boolean> {
        const consumedMessageKey = toConsumedMessageKey(domainEventId, consumerId, tenantId);
        const inMemoryTransactionContext = getInMemoryTransactionContext(transactionContext);

        return this.getConsumedMessageStore(inMemoryTransactionContext).has(consumedMessageKey);
    }

    public async markMessageAsConsumed(
        transactionContext: TransactionContext | null,
        domainEventId: string,
        consumerId: string,
        tenantId?: string | null
    ): Promise<void> {
        const consumedMessageKey = toConsumedMessageKey(domainEventId, consumerId, tenantId);
        const inMemoryTransactionContext = getInMemoryTransactionContext(transactionContext);
        const store = this.getConsumedMessageStore(inMemoryTransactionContext);

        if (store.has(consumedMessageKey)) {
            throw new Error("Message is already marked as consumed");
        }

        store.add(consumedMessageKey);
    }

    private getConsumedMessageStore(transactionContext: InMemoryTransactionContext | null): Set<string> {
        return getTransactionalStore(
            transactionContext,
            this.storeKey,
            () => this.consumedMessageKeys,
            (consumedMessageKeys) => {
                this.consumedMessageKeys = consumedMessageKeys;
            }
        );
    }
}
