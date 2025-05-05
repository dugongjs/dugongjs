import type { IConsumedMessageRepository } from "../../ports/index.js";
import type { ILogger } from "../logger/i-logger.js";

export type WaitForMessageConsumerOptions = {
    consumedMessageRepository: IConsumedMessageRepository;
    logger?: ILogger;
    pollingInterval?: number;
};

/**
 * Utility class to wait for a message to be consumed. This is primarily intended for testing purposes.
 */
export class WaitForMessageConsumer {
    private readonly consumedMessageRepository: IConsumedMessageRepository;
    private readonly logger?: ILogger;
    private readonly pollingInterval: number;

    constructor(options: WaitForMessageConsumerOptions) {
        this.consumedMessageRepository = options.consumedMessageRepository;
        this.logger = options.logger;
        this.pollingInterval = options.pollingInterval ?? 100;
    }

    /**
     * Waits for the specified messages to be consumed by the given message consumer.
     * @param messageConsumerId ID of the message consumer.
     * @param ids IDs of the messages to wait for.
     * @returns A promise that resolves when all messages are consumed.
     */
    public async waitForMessagesToBeConsumed(messageConsumerId: string, ...ids: string[]): Promise<void> {
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

            this.logger?.verbose(`Waiting for messages to be consumed: ${Array.from(remainingIds).join(", ")}`);

            await new Promise((resolve) => setTimeout(resolve, this.pollingInterval));
        }
    }
}
