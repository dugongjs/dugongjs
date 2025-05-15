import { InMemoryMessageBus } from "./in-memory-message-bus.js";

describe("InMemoryMessageBus", () => {
    type TestMessage = { content: string };
    const mockTransactionContext = { id: "test-transaction" };

    it("should allow subscribing to a channel and invoking handlers on publish", async () => {
        const bus = new InMemoryMessageBus<TestMessage>();
        const handler = vi.fn();

        bus.subscribe("test-channel", handler);

        const messages = [{ content: "Hello World!" }];
        await bus.publish("test-channel", messages);

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith(messages[0], undefined);
    });

    it("should pass the transaction context to handlers", async () => {
        const bus = new InMemoryMessageBus<TestMessage>();
        const handler = vi.fn();

        bus.subscribe("test-channel", handler);

        const messages = [{ content: "Hello Transaction!" }];
        await bus.publish("test-channel", messages, mockTransactionContext);

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith(messages[0], mockTransactionContext);
    });

    it("should handle multiple handlers for the same channel", async () => {
        const bus = new InMemoryMessageBus<TestMessage>();
        const handler1 = vi.fn();
        const handler2 = vi.fn();

        bus.subscribe("test-channel", handler1);
        bus.subscribe("test-channel", handler2);

        const messages = [{ content: "Hello Handlers!" }];
        await bus.publish("test-channel", messages);

        expect(handler1).toHaveBeenCalledTimes(1);
        expect(handler2).toHaveBeenCalledTimes(1);
        expect(handler1).toHaveBeenCalledWith(messages[0], undefined);
        expect(handler2).toHaveBeenCalledWith(messages[0], undefined);
    });

    it("should not invoke handlers for other channels", async () => {
        const bus = new InMemoryMessageBus<TestMessage>();
        const handler = vi.fn();

        bus.subscribe("test-channel", handler);

        const messages = [{ content: "Hello Other Channel!" }];
        await bus.publish("other-channel", messages);

        expect(handler).not.toHaveBeenCalled();
    });

    it("should handle publishing with no subscribers gracefully", async () => {
        const bus = new InMemoryMessageBus<TestMessage>();

        const messages = [{ content: "No Subscribers" }];
        await expect(bus.publish("empty-channel", messages)).resolves.not.toThrow();
    });
});
