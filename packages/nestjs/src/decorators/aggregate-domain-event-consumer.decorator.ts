import type { EventSourcedAggregateRoot, HandleMessageOptions } from "@dugongjs/core";

export const AGGREGATE_DOMAIN_EVENT_CONSUMER_TOKEN = "AGGREGATE_DOMAIN_EVENT_CONSUMER_TOKEN" as const;

export type AggregateDomainEventConsumerMetadata = {
    aggregateClass: EventSourcedAggregateRoot;
    consumerName: string;
    options?: HandleMessageOptions;
};

export const AggregateDomainEventConsumer =
    (
        aggregateClass: EventSourcedAggregateRoot,
        consumerName: string,
        options?: HandleMessageOptions
    ): ClassDecorator =>
    (target) =>
        Reflect.defineMetadata(
            AGGREGATE_DOMAIN_EVENT_CONSUMER_TOKEN,
            {
                aggregateClass,
                consumerName,
                options
            },
            target
        );
