import type { IMessageChannelParticipant } from "../../common/message-broker/i-message-channel-participant.js";
import type { TransactionContext } from "../../outbound/transaction-manager/i-transaction-manager.js";

export type OnMessage<TMessage> = (message: TMessage, transactionContext?: TransactionContext) => Promise<void>;

/**
 * Inbound port interface for a message consumer.
 */
export interface IMessageConsumer<TMessage> extends IMessageChannelParticipant {
    /**
     * Generates a message consumer ID for a specific aggregate, using metadata from the aggregate and the current origin.
     * The message consumer ID is used to identify the consumer within the message broker.
     * @param origin The origin of the consumer, used to uniquely identify the consumer.
     * @param aggregateType The type of the aggregate, used to uniquely identify the aggregate.
     * @param consumerName The name of the consumer, used to uniquely identify the consumer.
     * @returns The generated message consumer ID.
     */
    generateMessageConsumerIdForAggregate(origin: string, aggregateType: string, consumerName: string): string;

    /**
     * Registers a message consumer for a specific channel.
     * The consumer ID is used to identify the consumer within the channel.
     * The consumer ID is used to identify the consumer within the channel.
     * The onMessage callback is invoked when a message is received on the channel.
     * @param channelId The ID of the channel to which the consumer will be registered.
     * @param consumerId The ID of the consumer to be registered.
     * @param onMessage The callback function to be invoked when a message is received.
     */
    registerDomainEventMessageConsumer(
        channelId: string,
        consumerId: string,
        onMessage?: OnMessage<TMessage>
    ): Promise<void>;
}

export const IMessageConsumer = "IMessageConsumer" as const;
