import type { OnMessage } from "../../ports/inbound/message-broker/i-message-consumer.js";
import type { TransactionContext } from "../../ports/outbound/transaction-manager/i-transaction-manager.js";

export class InMemoryMessageBus<TMessage> {
    private handlers = new Map<string, OnMessage<TMessage>[]>();

    public subscribe(channelId: string, handler: OnMessage<TMessage>): void {
        if (!this.handlers.has(channelId)) {
            this.handlers.set(channelId, []);
        }

        this.handlers.get(channelId)!.push(handler);
    }

    public async publish(
        channelId: string,
        messages: TMessage[],
        transactionContext?: TransactionContext
    ): Promise<void> {
        const handlers = this.handlers.get(channelId) ?? [];
        for (const message of messages) {
            for (const handler of handlers) {
                await handler(message, transactionContext);
            }
        }
    }
}
