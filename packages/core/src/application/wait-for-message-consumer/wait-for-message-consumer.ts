import type { IMessageConsumer } from "../../ports/index.js";
import type { IConsumedMessageRepository } from "../../ports/outbound/repository/i-consumed-message-repository.js";
import {
    AbstractAggregateHandler,
    type AbstractAggregateHandlerOptions
} from "../abstract-aggregate-handler/abstract-aggregate-handler.js";

export type WaitForMessageConsumerOptions = Omit<
    AbstractAggregateHandlerOptions<any> & {
        consumedMessageRepository: IConsumedMessageRepository;
        messageConsumer: IMessageConsumer<any>;
        pollingInterval?: number;
    },
    "transactionManager"
>;

/**
 * Utility class to wait for a message to be consumed. This is primarily intended for testing purposes.
 */
export class WaitForMessageConsumer extends AbstractAggregateHandler<any> {
    private readonly consumedMessageRepository: IConsumedMessageRepository;
    private readonly messageConsumer: IMessageConsumer<any>;
    private readonly pollingInterval: number;

    constructor(options: WaitForMessageConsumerOptions) {
        super({ ...options, transactionManager: { transaction: (fn) => fn({}) } });
        this.consumedMessageRepository = options.consumedMessageRepository;
        this.messageConsumer = options.messageConsumer;
        this.pollingInterval = options.pollingInterval ?? 100;
    }

    /**
     * Waits for the specified messages to be consumed by the given message consumer.
     * @param consumerName Name of the message consumer.
     * @param ids IDs of the messages to wait for.
     * @returns A promise that resolves when all messages are consumed.
     */
    public async waitForMessagesToBeConsumed(consumerName: string, ...ids: string[]): Promise<void> {
        const messageConsumerId = this.messageConsumer.generateMessageConsumerIdForAggregate(
            this.currentOrigin,
            this.aggregateType,
            consumerName
        );

        if (ids.length === 0) {
            this.logger?.verbose("No messages to wait for");
            return;
        }

        const remainingIds = new Set(ids);

        while (true) {
            const remainingIdsArray = Array.from(remainingIds);

            const results = await Promise.all(
                remainingIdsArray.map(async (id) =>
                    this.consumedMessageRepository.checkIfMessageIsConsumed(null, id, messageConsumerId)
                )
            );

            results.forEach((result, index) => {
                const id = remainingIdsArray[index];
                if (result) {
                    this.logger?.verbose(`Message ${id} consumed`);
                    remainingIds.delete(id);
                }
            });

            if (remainingIds.size === 0) {
                this.logger?.verbose("All messages consumed");
                return;
            }

            this.logger?.verbose(
                `${messageConsumerId} waiting for domain events to be consumed: ${Array.from(remainingIds).join(", ")}`
            );

            await new Promise((resolve) => setTimeout(resolve, this.pollingInterval));
        }
    }
}
