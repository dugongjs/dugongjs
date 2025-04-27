/**
 * Common port interface for a message channel participant.
 */
export interface IMessageChannelParticipant {
    /**
     * Generates a message channel ID for a specific aggregate, using metadata from the aggregate.
     * The message channel ID is used to identify the channel to which messages will be published.
     * @param origin The origin of the aggregate, used to uniquely identify the aggregate.
     * @param aggregateType The type of the aggregate, used to uniquely identify the aggregate.
     * @returns The generated message channel ID.
     */
    generateMessageChannelIdForAggregate(origin: string, aggregateType: string): string;
}
