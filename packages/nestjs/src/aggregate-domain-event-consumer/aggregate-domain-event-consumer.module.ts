import { Module } from "@nestjs/common";
import { DiscoveryModule, MetadataScanner } from "@nestjs/core";
import { AggregateMessageConsumerService } from "../aggregate-message-consumer/aggregate-message-consumer.service.js";
import { AggregateDomainEventConsumerExplorerService } from "./aggregate-domain-event-consumer-explorer.service.js";

@Module({
    imports: [DiscoveryModule],
    providers: [AggregateDomainEventConsumerExplorerService, AggregateMessageConsumerService, MetadataScanner]
})
export class AggregateDomainEventConsumerModule {}
