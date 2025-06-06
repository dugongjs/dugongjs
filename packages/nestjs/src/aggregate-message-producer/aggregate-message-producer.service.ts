import {
    AbstractDomainEvent,
    AbstractEventSourcedAggregateRoot,
    AggregateMessageProducer,
    IMessageProducer,
    IOutboundMessageMapper,
    ITransactionManager,
    type RemoveAbstract
} from "@dugongjs/core";
import { Injectable, Logger } from "@nestjs/common";
import { InjectCurrentOrigin } from "../decorators/inject-current-origin.decorator.js";
import { InjectMessageProducer } from "../decorators/inject-message-producer.decorator.js";
import { InjectOutboundMessageMapper } from "../decorators/inject-outbound-message-mapper.decorator.js";
import { InjectTransactionManager } from "../decorators/inject-transaction-manager.decorator.js";

@Injectable()
export class AggregateMessageProducerService {
    private readonly logger = new Logger(AggregateMessageProducerService.name);

    constructor(
        @InjectTransactionManager() private readonly transactionManager: ITransactionManager,
        @InjectMessageProducer() private readonly messageProducer: IMessageProducer<any>,
        @InjectOutboundMessageMapper() private readonly outboundMessageMapper: IOutboundMessageMapper<any>,
        @InjectCurrentOrigin() private readonly currentOrigin: string
    ) {}

    public getAggregateMessageProducer<
        TAggregateRootClass extends RemoveAbstract<typeof AbstractEventSourcedAggregateRoot>
    >(aggregateClass: TAggregateRootClass): AggregateMessageProducer<TAggregateRootClass, any> {
        return new AggregateMessageProducer({
            aggregateClass,
            currentOrigin: this.currentOrigin,
            transactionManager: this.transactionManager,
            messageProducer: this.messageProducer,
            outboundMessageMapper: this.outboundMessageMapper,
            logger: this.logger
        });
    }

    public async publishDomainEventsAsMessages<
        TAggregateRootClass extends RemoveAbstract<typeof AbstractEventSourcedAggregateRoot>
    >(aggregateClass: TAggregateRootClass, domainEvents: AbstractDomainEvent[]): Promise<void> {
        const aggregateMessageProducer = this.getAggregateMessageProducer(aggregateClass);

        await aggregateMessageProducer.publishDomainEventsAsMessages(domainEvents);
    }
}
