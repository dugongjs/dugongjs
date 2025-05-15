import { Controller, type OnModuleInit } from "@nestjs/common";
import { AggregateMessageConsumerService } from "../aggregate-message-consumer/aggregate-message-consumer.service.js";
import { QueryModelProjectionConsumerService } from "./query-model-projection-consumer.service.js";

@Controller()
export class QueryModelProjectionConsumerController implements OnModuleInit {
    constructor(
        private readonly aggregateMessageConsumerService: AggregateMessageConsumerService,
        private readonly queryModelProjectionConsumerService: QueryModelProjectionConsumerService
    ) {}

    public async onModuleInit(): Promise<void> {
        await this.aggregateMessageConsumerService.registerMessageConsumerForAggregate(
            this.queryModelProjectionConsumerService.getAggregateClass(),
            "QueryModelProjectionConsumer",
            (context) => this.queryModelProjectionConsumerService.updateQueryModel(context)
        );
    }
}
