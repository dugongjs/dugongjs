import type { TransactionContext } from "../transaction-manager/i-transaction-manager.js";

export type SerializedSnapshot = {
    origin: string;
    aggregateType: string;
    aggregateId: string;
    domainEventSequenceNumber: number;
    snapshotData: any;
};

/**
 * Outbound port interface for a repository that manages snapshots.
 */
export interface ISnapshotRepository {
    /**
     * Retrieves the latest snapshot for a specific aggregate.
     * - Must return the latest snapshot for the given aggregate type and ID, where 'latest' means the one with the highest domain event sequence number.
     * - Must return null if no snapshot is found.
     * @param transactionContext Transaction context for the operation, or null if not using transactions.
     * @param origin The origin of the aggregate, used to uniquely identify the aggregate.
     * @param aggregateType The type of the aggregate, used to uniquely identify the aggregate.
     * @param aggregateId The ID of the aggregate, used to uniquely identify the aggregate.
     * @returns A promise that resolves to the latest snapshot for the given aggregate, or null if no snapshot is found.
     */
    getLatestSnapshot(
        transactionContext: TransactionContext | null,
        origin: string,
        aggregateType: string,
        aggregateId: string
    ): Promise<SerializedSnapshot | null>;

    /**
     * Saves a snapshot for a specific aggregate.
     * - May append or overwrite any existing snapshot.
     * @param transactionContext Transaction context for the operation, or null if not using transactions.
     * @param snapshot The snapshot to save.
     */
    saveSnapshot(transactionContext: TransactionContext | null, snapshot: SerializedSnapshot): Promise<void>;
}

export const ISnapshotRepository = "ISnapshotRepository" as const;
