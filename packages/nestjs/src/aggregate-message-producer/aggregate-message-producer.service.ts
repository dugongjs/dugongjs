import {
    AbstractDomainEvent,
    AggregateMessageProducer,
    IMessageProducer,
    IOutboundMessageMapper,
    ITransactionManager,
    type EventSourcedAggregateRoot,
    type ILogger
} from "@dugongjs/core";
import { Injectable, Optional } from "@nestjs/common";
import { InjectCurrentOrigin } from "../decorators/inject-current-origin.decorator.js";
import { InjectLoggerFactory } from "../decorators/inject-logger-factory.decorator.js";
import { InjectMessageProducer } from "../decorators/inject-message-producer.decorator.js";
import { InjectOutboundMessageMapper } from "../decorators/inject-outbound-message-mapper.decorator.js";
import { InjectTransactionManager } from "../decorators/inject-transaction-manager.decorator.js";
import type { ILoggerFactory } from "../logger/i-logger-factory.js";

@Injectable()
export class AggregateMessageProducerService {
    private readonly logger?: ILogger;

    constructor(
        @InjectTransactionManager() private readonly transactionManager: ITransactionManager,
        @InjectMessageProducer() private readonly messageProducer: IMessageProducer<any>,
        @InjectOutboundMessageMapper() private readonly outboundMessageMapper: IOutboundMessageMapper<any>,
        @InjectCurrentOrigin() private readonly currentOrigin: string,
        @Optional() @InjectLoggerFactory() loggerFactory?: ILoggerFactory
    ) {
        this.logger = loggerFactory?.createLogger(AggregateMessageProducerService.name);
    }

    public getAggregateMessageProducer<TAggregateRootClass extends EventSourcedAggregateRoot>(
        aggregateClass: TAggregateRootClass
    ): AggregateMessageProducer<TAggregateRootClass, any> {
        return new AggregateMessageProducer({
            aggregateClass,
            currentOrigin: this.currentOrigin,
            transactionManager: this.transactionManager,
            messageProducer: this.messageProducer,
            outboundMessageMapper: this.outboundMessageMapper,
            logger: this.logger
        });
    }

    public async publishDomainEventsAsMessages<TAggregateRootClass extends EventSourcedAggregateRoot>(
        aggregateClass: TAggregateRootClass,
        domainEvents: AbstractDomainEvent[]
    ): Promise<void> {
        const aggregateMessageProducer = this.getAggregateMessageProducer(aggregateClass);

        await aggregateMessageProducer.publishDomainEventsAsMessages(domainEvents);
    }
}
