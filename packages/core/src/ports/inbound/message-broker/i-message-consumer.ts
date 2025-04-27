import type { IMessageChannelParticipant } from "../../common/message-broker/i-message-channel-participant.js";

/**
 * Inbound port interface for a message consumer.
 */
export interface IMessageConsumer<TMessage> extends IMessageChannelParticipant {
    /**
     * Generates a message channel ID for a specific aggregate, using metadata from the aggregate and the current origin.
     * The message channel ID is used to identify the channel to which messages will be published.
     * @param origin The origin of the consumer, used to uniquely identify the consumer.
     * @param aggregateType The type of the aggregate, used to uniquely identify the aggregate.
     * @returns The generated message channel ID.
     */
    generateMessageConsumerIdForAggregate(origin: string, aggregateType: string): string;

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
        onMessage?: (message: TMessage) => Promise<void>
    ): Promise<void>;
}
