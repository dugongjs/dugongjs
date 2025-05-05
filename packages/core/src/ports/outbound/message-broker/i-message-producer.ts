import type { IMessageChannelParticipant } from "../../common/message-broker/i-message-channel-participant.js";
import type { TransactionContext } from "../transaction-manager/i-transaction-manager.js";

/**
 * Outbound port interface for a message producer.
 */
export interface IMessageProducer<TMessage> extends IMessageChannelParticipant {
    publishMessage(
        transactionContext: TransactionContext | null,
        messageChannelId: string,
        message: TMessage
    ): Promise<void>;

    publishMessages(
        transactionContext: TransactionContext | null,
        messageChannelId: string,
        messages: TMessage[]
    ): Promise<void>;
}

export const IMessageProducer = "IMessageProducer" as const;
