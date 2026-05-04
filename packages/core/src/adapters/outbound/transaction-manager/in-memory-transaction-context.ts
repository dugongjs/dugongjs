import type { TransactionContext } from "../../../ports/outbound/transaction-manager/i-transaction-manager.js";

export const InMemoryTransactionContextSymbol = Symbol("InMemoryTransactionContext");

export class InMemoryTransactionContext {
    private readonly stores = new Map<symbol, unknown>();
    private readonly commits = new Map<symbol, () => void>();

    public getTransactionalStore<TStore>(
        storeKey: symbol,
        getBaseStore: () => TStore,
        setBaseStore: (store: TStore) => void
    ): TStore {
        if (this.stores.has(storeKey)) {
            return this.stores.get(storeKey) as TStore;
        }

        const transactionalStore = structuredClone(getBaseStore()) as TStore;

        this.stores.set(storeKey, transactionalStore);
        this.commits.set(storeKey, () => {
            setBaseStore(transactionalStore);
        });

        return transactionalStore;
    }

    public commit(): void {
        const committers = this.commits.values();

        for (const commit of committers) {
            commit();
        }
    }
}

type InMemoryTransactionContextCarrier = TransactionContext & {
    [InMemoryTransactionContextSymbol]: InMemoryTransactionContext;
};

export function createInMemoryTransactionContextCarrier(): InMemoryTransactionContextCarrier {
    return {
        [InMemoryTransactionContextSymbol]: new InMemoryTransactionContext()
    };
}

export function getInMemoryTransactionContext(
    transactionContext: TransactionContext | null | undefined
): InMemoryTransactionContext | null {
    if (!transactionContext || typeof transactionContext !== "object") {
        return null;
    }

    if (transactionContext instanceof InMemoryTransactionContext) {
        return transactionContext;
    }

    if (InMemoryTransactionContextSymbol in transactionContext) {
        return (transactionContext as InMemoryTransactionContextCarrier)[InMemoryTransactionContextSymbol];
    }

    return null;
}

export function getTransactionalStore<TStore>(
    transactionContext: InMemoryTransactionContext | null,
    storeKey: symbol,
    getBaseStore: () => TStore,
    setBaseStore: (store: TStore) => void
): TStore {
    if (!transactionContext) {
        return getBaseStore();
    }

    return transactionContext.getTransactionalStore(storeKey, getBaseStore, setBaseStore);
}
