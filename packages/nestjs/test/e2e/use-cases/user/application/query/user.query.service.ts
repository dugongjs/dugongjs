import { Injectable } from "@nestjs/common";
import { EventSourcingService } from "../../../../../../src/services/event-sourcing.service.js";
import { User } from "../../domain/user.js";

@Injectable()
export class UserQueryService {
    constructor(private readonly eventSourcingService: EventSourcingService) {}

    public async getUser(userId: string): Promise<User | null> {
        return this.eventSourcingService.transaction(async (transactionContext) => {
            const userContext = this.eventSourcingService.createAggregateContext(transactionContext, User);

            const user = await userContext.build(userId);

            return user;
        });
    }
}
