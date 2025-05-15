import type { TransactionContext } from "@dugongjs/core";
import type { User } from "../../domain/user.js";

export type UserQueryModel = {
    id: string;
    username: string;
    email: string;
};

export interface IUserQueryModelRepository {
    updateQueryModel(transactionContext: TransactionContext | null, user: User): Promise<void>;

    deleteQueryModel(transactionContext: TransactionContext | null, userId: string): Promise<void>;

    getQueryModelById(transactionContext: TransactionContext | null, userId: string): Promise<UserQueryModel | null>;

    getAllQueryModels(transactionContext: TransactionContext | null): Promise<UserQueryModel[]>;
}

export const IUserQueryModelRepository = "IUserQueryModelRepository" as const;
