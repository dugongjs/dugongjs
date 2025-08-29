import type { DomainEventClass } from "@dugongjs/core";
import { Injectable, Logger, type OnModuleInit } from "@nestjs/common";
import { DiscoveryService, MetadataScanner } from "@nestjs/core";
import { AggregateMessageConsumerService } from "../aggregate-message-consumer/aggregate-message-consumer.service.js";
import { AGGREGATE_DOMAIN_EVENT_CONSUMER_TOKEN } from "../decorators/aggregate-domain-event-consumer.decorator.js";
import { ON_DOMAIN_EVENT_TOKEN } from "../decorators/on-domain-event.decorator.js";

@Injectable()
export class AggregateDomainEventConsumerExplorerService implements OnModuleInit {
    private readonly logger = new Logger(AggregateDomainEventConsumerExplorerService.name);

    constructor(
        private readonly discoveryService: DiscoveryService,
        private readonly metadataScanner: MetadataScanner,
        private readonly aggregateMessageConsumerService: AggregateMessageConsumerService
    ) {}

    public async onModuleInit() {
        const controllers = this.discoveryService.getControllers();

        for (const wrapper of controllers) {
            const instance = wrapper.instance;
            const metatype = wrapper.metatype;

            if (!instance || !metatype) {
                continue;
            }

            const aggregateDomainEventConsumerMetadata = Reflect.getMetadata(
                AGGREGATE_DOMAIN_EVENT_CONSUMER_TOKEN,
                metatype
            );

            if (!aggregateDomainEventConsumerMetadata) {
                continue;
            }

            const { aggregateClass, consumerName } = aggregateDomainEventConsumerMetadata;

            const handlers = this.collectHandlers(instance);

            const consumer = this.aggregateMessageConsumerService.getAggregateMessageConsumer(aggregateClass);

            await consumer.registerMessageConsumerForAggregate(consumerName, async (context) => {
                const { domainEvent } = context;

                for (const [methodKey, domainEventClasses] of handlers) {
                    if (domainEventClasses.some((cls) => domainEvent instanceof cls)) {
                        const method = instance[methodKey].bind(instance);

                        const logPrefix = consumer.getLogPrefix();
                        const logContext = consumer.getMessageLogContext(consumerName, domainEvent);
                        this.logger.log(logContext, `${logPrefix}Message received`);

                        await method(context);
                    }
                }
            });
        }
    }

    private collectHandlers(instance: Record<string, any>): Map<string | symbol, DomainEventClass[]> {
        const prototype = Object.getPrototypeOf(instance);
        const map = new Map<string | symbol, DomainEventClass[]>();

        const methodNames = this.metadataScanner.getAllMethodNames(prototype);

        for (const name of methodNames) {
            const domainEventClasses: DomainEventClass[] =
                Reflect.getMetadata(ON_DOMAIN_EVENT_TOKEN, prototype, name) ?? [];
            if (domainEventClasses.length > 0) {
                map.set(name, domainEventClasses);
            }
        }

        return map;
    }
}
