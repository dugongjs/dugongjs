import type { TransactionContext } from "../../../ports/index.js";
import type {
    ISnapshotRepository,
    SerializedSnapshot
} from "../../../ports/outbound/repository/i-snapshot-repository.js";
import {
    getInMemoryTransactionContext,
    getTransactionalStore,
    type InMemoryTransactionContext
} from "../transaction-manager/in-memory-transaction-context.js";

export class SnapshotRepositoryInMemory implements ISnapshotRepository {
    private snapshots: SerializedSnapshot[] = [];
    private readonly storeKey = Symbol("SnapshotRepositoryInMemory");

    public async getLatestSnapshot(
        transactionContext: TransactionContext | null,
        origin: string,
        aggregateType: string,
        aggregateId: string,
        tenantId?: string | null
    ): Promise<SerializedSnapshot | null> {
        const inMemoryTransactionContext = getInMemoryTransactionContext(transactionContext);

        const matchingSnapshots = this.getSnapshotStore(inMemoryTransactionContext).filter((snapshot) => {
            if (
                snapshot.origin !== origin ||
                snapshot.aggregateType !== aggregateType ||
                snapshot.aggregateId !== aggregateId
            ) {
                return false;
            }

            if (tenantId !== undefined && tenantId !== null) {
                return (snapshot.tenantId ?? null) === tenantId;
            }

            return true;
        });

        if (matchingSnapshots.length === 0) {
            return null;
        }

        const latestSnapshot = [...matchingSnapshots].sort(
            (snapshotA, snapshotB) => snapshotB.domainEventSequenceNumber - snapshotA.domainEventSequenceNumber
        )[0]!;

        return structuredClone(latestSnapshot);
    }

    public async saveSnapshot(
        transactionContext: TransactionContext | null,
        snapshot: SerializedSnapshot
    ): Promise<void> {
        const inMemoryTransactionContext = getInMemoryTransactionContext(transactionContext);

        this.getSnapshotStore(inMemoryTransactionContext).push(structuredClone(snapshot));
    }

    private getSnapshotStore(transactionContext: InMemoryTransactionContext | null): SerializedSnapshot[] {
        return getTransactionalStore(
            transactionContext,
            this.storeKey,
            () => this.snapshots,
            (snapshots) => {
                this.snapshots = snapshots;
            }
        );
    }
}
