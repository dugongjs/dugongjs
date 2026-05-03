import type { DugongAdapters } from "@dugongjs/nestjs";
import { TransactionManagerTypeOrmService } from "../modules/transaction-manager-typeorm/transaction-manager-typeorm.service.js";

export const transactionManagerTypeOrmAdapter = {
    transactionManager: TransactionManagerTypeOrmService
} satisfies DugongAdapters;
