import type { IMessageChannelParticipant } from "../../../ports/common/message-broker/i-message-channel-participant.js";

export class MessageChannelParticipantInMemory implements IMessageChannelParticipant {
    public generateMessageChannelIdForAggregate(origin: string, aggregateType: string): string {
        return `${origin}-${aggregateType}`;
    }
}
