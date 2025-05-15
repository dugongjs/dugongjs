import type { TransactionContext } from "@dugongjs/core";
import { Inject, Injectable } from "@nestjs/common";
import type { IQueryModelProjectionHandler } from "../../../../../../src/query-model-projection-consumer/i-query-model-projection-handler.js";
import { User } from "../../domain/user.js";
import { IUserQueryModelRepository } from "../../ports/repository/i-user-query-model-repository.js";

@Injectable()
export class UserQueryModelProjectionHandlerService implements IQueryModelProjectionHandler<typeof User> {
    constructor(@Inject(IUserQueryModelRepository) private readonly queryModelRepository: IUserQueryModelRepository) {}

    public getAggregateClass(): typeof User {
        return User;
    }

    public async updateQueryModel(transactionContext: TransactionContext | null, aggregate: User): Promise<void> {
        return this.queryModelRepository.updateQueryModel(transactionContext, aggregate);
    }

    public async deleteQueryModel(transactionContext: TransactionContext | null, aggregateId: string): Promise<void> {
        return this.queryModelRepository.deleteQueryModel(transactionContext, aggregateId);
    }
}
