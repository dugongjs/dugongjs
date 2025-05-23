import {
    AbstractEventSourcedAggregateRoot,
    IConsumedMessageRepository,
    IMessageConsumer,
    WaitForMessageConsumer,
    type RemoveAbstract
} from "@dugongjs/core";
import { Injectable, Logger } from "@nestjs/common";
import { InjectConsumedMessageRepository } from "../decorators/inject-comsumed-message-repository.decorator.js";
import { InjectCurrentOrigin } from "../decorators/inject-current-origin.decorator.js";
import { InjectMessageConsumer } from "../decorators/inject-message-consumer.decorator.js";

@Injectable()
export class WaitForMessageConsumerService {
    private readonly logger = new Logger(WaitForMessageConsumerService.name);

    constructor(
        @InjectCurrentOrigin() private readonly currentOrigin: string,
        @InjectConsumedMessageRepository() private readonly consumedMessageRepository: IConsumedMessageRepository,
        @InjectMessageConsumer() private readonly messageConsumer: IMessageConsumer<any>
    ) {}

    public getWaitForMessageConsumer(
        aggregateClass: RemoveAbstract<typeof AbstractEventSourcedAggregateRoot>
    ): WaitForMessageConsumer {
        return new WaitForMessageConsumer({
            aggregateClass,
            currentOrigin: this.currentOrigin,
            consumedMessageRepository: this.consumedMessageRepository,
            messageConsumer: this.messageConsumer,
            logger: this.logger
        });
    }

    public async waitForMessagesToBeConsumed(
        aggregateClass: RemoveAbstract<typeof AbstractEventSourcedAggregateRoot>,
        consumerName: string,
        ...ids: string[]
    ): Promise<void> {
        const waitForMessageConsumer = this.getWaitForMessageConsumer(aggregateClass);

        return waitForMessageConsumer.waitForMessagesToBeConsumed(consumerName, ...ids);
    }
}
