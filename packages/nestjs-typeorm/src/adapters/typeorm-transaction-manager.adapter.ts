import type { DugongAdapters } from "@dugongjs/nestjs";
import { TransactionManagerTypeOrmService } from "../modules/transaction-manager-typeorm/transaction-manager-typeorm.service.js";

export const typeOrmTransactionManagerAdapter = {
    transactionManager: TransactionManagerTypeOrmService
} satisfies DugongAdapters;
