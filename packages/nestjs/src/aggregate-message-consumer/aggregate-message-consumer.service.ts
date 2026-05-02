import {
    AggregateMessageConsumer,
    IConsumedMessageRepository,
    IDomainEventRepository,
    IInboundMessageMapper,
    IMessageConsumer,
    ITransactionManager,
    type EventSourcedAggregateRoot,
    type HandleMessage,
    type HandleMessageOptions,
    type ILogger
} from "@dugongjs/core";
import { Injectable, Optional } from "@nestjs/common";
import { InjectConsumedMessageRepository } from "../decorators/inject-consumed-message-repository.decorator.js";
import { InjectCurrentOrigin } from "../decorators/inject-current-origin.decorator.js";
import { InjectDomainEventRepository } from "../decorators/inject-domain-event-repository.decorator.js";
import { InjectInboundMessageMapper } from "../decorators/inject-inbound-message-mapper.decorator.js";
import { InjectLoggerFactory } from "../decorators/inject-logger-factory.decorator.js";
import { InjectMessageConsumer } from "../decorators/inject-message-consumer.decorator.js";
import { InjectTransactionManager } from "../decorators/inject-transaction-manager.decorator.js";
import type { ILoggerFactory } from "../logger/i-logger-factory.js";

@Injectable()
export class AggregateMessageConsumerService {
    private readonly logger?: ILogger;

    constructor(
        @InjectTransactionManager() private readonly transactionManager: ITransactionManager,
        @InjectDomainEventRepository() private readonly domainEventRepository: IDomainEventRepository,
        @InjectConsumedMessageRepository() private readonly consumedMessageRepository: IConsumedMessageRepository,
        @InjectMessageConsumer() private readonly messageConsumer: IMessageConsumer<any>,
        @InjectInboundMessageMapper() private readonly inboundMessageMapper: IInboundMessageMapper<any>,
        @InjectCurrentOrigin() private readonly currentOrigin: string,
        @Optional() @InjectLoggerFactory() loggerFactory?: ILoggerFactory
    ) {
        this.logger = loggerFactory?.createLogger(AggregateMessageConsumerService.name);
    }

    public getAggregateMessageConsumer<TAggregateRootClass extends EventSourcedAggregateRoot>(
        aggregateClass: TAggregateRootClass
    ): AggregateMessageConsumer<TAggregateRootClass, any> {
        return new AggregateMessageConsumer({
            aggregateClass,
            transactionManager: this.transactionManager,
            domainEventRepository: this.domainEventRepository,
            consumedMessageRepository: this.consumedMessageRepository,
            messageConsumer: this.messageConsumer,
            inboundMessageMapper: this.inboundMessageMapper,
            currentOrigin: this.currentOrigin,
            logger: this.logger
        });
    }

    public async registerMessageConsumerForAggregate<TAggregateRootClass extends EventSourcedAggregateRoot>(
        aggregateClass: TAggregateRootClass,
        consumerName: string,
        handleMessage?: HandleMessage,
        options?: HandleMessageOptions
    ): Promise<AggregateMessageConsumer<TAggregateRootClass, any>> {
        const aggregateMessageConsumer = this.getAggregateMessageConsumer(aggregateClass);

        await aggregateMessageConsumer.registerMessageConsumerForAggregate(consumerName, handleMessage, options);

        return aggregateMessageConsumer;
    }
}
