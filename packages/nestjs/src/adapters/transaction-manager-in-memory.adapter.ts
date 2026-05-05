import type { DugongAdapters } from "../dugong/dugong-adapter.js";
import { TransactionManagerInMemoryService } from "../transaction-manager-in-memory/transaction-manager-in-memory.service.js";

export const transactionManagerInMemoryAdapter = {
    transactionManager: TransactionManagerInMemoryService
} satisfies DugongAdapters;
