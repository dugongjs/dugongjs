import type { IMessageChannelParticipant } from "@dugongjs/core";
import * as changeCase from "change-case";

/**
 * MessageChannelParticipantKafkaJS is an implementation of the IMessageChannelParticipant interface that provides a method to generate message channel IDs for Kafka topics based on the origin and aggregate type.
 */
export class MessageChannelParticipantKafkaJS implements IMessageChannelParticipant {
    /**
     * Generates a unique message channel ID based on the provided origin and aggregate type.
     * @param origin The origin or source of the messages (e.g., service name or application name).
     * @param aggregateType The type of aggregate or domain entity that the channel is associated with (e.g., "Order", "User", etc.).
     * @returns A unique message channel ID string in kebab-case format, combining the origin and aggregate type. For example: "my-service-order".
     */
    public generateMessageChannelIdForAggregate(origin: string, aggregateType: string): string {
        const originKebabCase = changeCase.kebabCase(origin);
        const aggregateTypeKebabCase = changeCase.kebabCase(aggregateType);

        return `${originKebabCase}-${aggregateTypeKebabCase}`;
    }
}
