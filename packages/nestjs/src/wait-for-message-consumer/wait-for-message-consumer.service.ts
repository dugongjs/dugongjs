import {
    IConsumedMessageRepository,
    IDomainEventRepository,
    IMessageConsumer,
    WaitForMessageConsumer,
    type EventSourcedAggregateRoot,
    type ILogger
} from "@dugongjs/core";
import { Injectable, Optional } from "@nestjs/common";
import { InjectConsumedMessageRepository } from "../decorators/inject-consumed-message-repository.decorator.js";
import { InjectCurrentOrigin } from "../decorators/inject-current-origin.decorator.js";
import { InjectDomainEventRepository } from "../decorators/inject-domain-event-repository.decorator.js";
import { InjectLoggerFactory } from "../decorators/inject-logger-factory.decorator.js";
import { InjectMessageConsumer } from "../decorators/inject-message-consumer.decorator.js";
import type { ILoggerFactory } from "../logger/i-logger-factory.js";

@Injectable()
export class WaitForMessageConsumerService {
    private readonly logger?: ILogger;

    constructor(
        @InjectCurrentOrigin() private readonly currentOrigin: string,
        @InjectDomainEventRepository() private readonly domainEventRepository: IDomainEventRepository,
        @InjectConsumedMessageRepository() private readonly consumedMessageRepository: IConsumedMessageRepository,
        @InjectMessageConsumer() private readonly messageConsumer: IMessageConsumer<any>,
        @Optional() @InjectLoggerFactory() loggerFactory?: ILoggerFactory
    ) {
        this.logger = loggerFactory?.createLogger(WaitForMessageConsumerService.name);
    }

    public getWaitForMessageConsumer(aggregateClass: EventSourcedAggregateRoot): WaitForMessageConsumer {
        return new WaitForMessageConsumer({
            aggregateClass,
            currentOrigin: this.currentOrigin,
            domainEventRepository: this.domainEventRepository,
            consumedMessageRepository: this.consumedMessageRepository,
            messageConsumer: this.messageConsumer,
            logger: this.logger
        });
    }

    public async waitForMessagesToBeConsumed(
        aggregateClass: EventSourcedAggregateRoot,
        consumerName: string,
        ...ids: string[]
    ): Promise<void> {
        const waitForMessageConsumer = this.getWaitForMessageConsumer(aggregateClass);

        return waitForMessageConsumer.waitForMessagesToBeConsumed(consumerName, ...ids);
    }

    public async waitForAggregateDomainEventsToBeConsumed(
        aggregateClass: EventSourcedAggregateRoot,
        consumerName: string,
        aggregateId: string,
        tenantId?: string | null,
        fromSequenceNumber?: number
    ): Promise<void> {
        const waitForMessageConsumer = this.getWaitForMessageConsumer(aggregateClass);

        return waitForMessageConsumer.waitForAggregateDomainEventsToBeConsumed(
            consumerName,
            aggregateId,
            tenantId,
            fromSequenceNumber
        );
    }
}
