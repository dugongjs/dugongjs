import type { HandleMessageOptions } from "@dugongjs/core";
import { Controller, Inject, Optional, type OnModuleInit } from "@nestjs/common";
import { AggregateMessageConsumerService } from "../aggregate-message-consumer/aggregate-message-consumer.service.js";
import {
    QUERY_MODEL_PROJECTION_CONSUMER,
    QUERY_MODEL_PROJECTION_CONSUMER_OPTIONS_TOKEN
} from "./query-model-projection-consumer.constants.js";
import { QueryModelProjectionConsumerService } from "./query-model-projection-consumer.service.js";

@Controller()
export class QueryModelProjectionConsumerController implements OnModuleInit {
    constructor(
        private readonly aggregateMessageConsumerService: AggregateMessageConsumerService,
        private readonly queryModelProjectionConsumerService: QueryModelProjectionConsumerService,
        @Optional()
        @Inject(QUERY_MODEL_PROJECTION_CONSUMER_OPTIONS_TOKEN)
        private readonly handleMessageOptions?: HandleMessageOptions
    ) {}

    public async onModuleInit(): Promise<void> {
        await this.aggregateMessageConsumerService.registerMessageConsumerForAggregate(
            this.queryModelProjectionConsumerService.getAggregateClass(),
            QUERY_MODEL_PROJECTION_CONSUMER,
            (context) => this.queryModelProjectionConsumerService.updateQueryModel(context),
            this.handleMessageOptions
        );
    }
}
