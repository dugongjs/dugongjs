import {
    AbstractAggregateRoot,
    AggregateMessageConsumer,
    IConsumedMessageRepository,
    IDomainEventRepository,
    IMessageConsumer,
    IMessageSerdes,
    ITransactionManager,
    type HandleMessage,
    type HandleMessageOptions,
    type RemoveAbstract
} from "@dugongjs/core";
import { Injectable, Logger } from "@nestjs/common";
import { InjectConsumedMessageRepository } from "../decorators/inject-comsumed-message-repository.decorator.js";
import { InjectCurrentOrigin } from "../decorators/inject-current-origin.decorator.js";
import { InjectDomainEventRepository } from "../decorators/inject-domain-event-repository.decorator.js";
import { InjectMessageConsumer } from "../decorators/inject-message-consumer.decorator.js";
import { InjectMessageSerdes } from "../decorators/inject-message-serdes.decorator.js";
import { InjectTransactionManager } from "../decorators/inject-transaction-manager.decorator.js";

@Injectable()
export class AggregateMessageConsumerService {
    private readonly logger = new Logger(AggregateMessageConsumerService.name);

    constructor(
        @InjectTransactionManager() private readonly transactionManager: ITransactionManager,
        @InjectDomainEventRepository() private readonly domainEventRepository: IDomainEventRepository,
        @InjectConsumedMessageRepository() private readonly consumedMessageRepository: IConsumedMessageRepository,
        @InjectMessageConsumer() private readonly messageConsumer: IMessageConsumer<any>,
        @InjectMessageSerdes() private readonly messageSerdes: IMessageSerdes<any>,
        @InjectCurrentOrigin() private readonly currentOrigin: string
    ) {}

    public async registerMessageConsumerForAggregate<
        TAggregateRootClass extends RemoveAbstract<typeof AbstractAggregateRoot>
    >(
        aggregateClass: TAggregateRootClass,
        consumerName: string,
        handleMessage?: HandleMessage,
        options?: HandleMessageOptions
    ): Promise<void> {
        const aggregateMessageConsumer = new AggregateMessageConsumer({
            aggregateClass,
            transactionManager: this.transactionManager,
            domainEventRepository: this.domainEventRepository,
            consumedMessageRepository: this.consumedMessageRepository,
            messageConsumer: this.messageConsumer,
            messageSerdes: this.messageSerdes,
            currentOrigin: this.currentOrigin,
            logger: this.logger
        });

        await aggregateMessageConsumer.registerMessageConsumerForAggregate(consumerName, handleMessage, options);
    }
}
