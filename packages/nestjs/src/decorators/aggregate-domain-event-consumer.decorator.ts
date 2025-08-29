import type { EventSourcedAggregateRoot } from "@dugongjs/core";

export const AGGREGATE_DOMAIN_EVENT_CONSUMER_TOKEN = "AGGREGATE_DOMAIN_EVENT_CONSUMER_TOKEN" as const;

export const AggregateDomainEventConsumer =
    (aggregateClass: EventSourcedAggregateRoot, consumerName: string): ClassDecorator =>
    (target) =>
        Reflect.defineMetadata(
            AGGREGATE_DOMAIN_EVENT_CONSUMER_TOKEN,
            {
                aggregateClass,
                consumerName
            },
            target
        );
