import { mock, mockReset } from "vitest-mock-extended";
import type { IConsumedMessageRepository } from "../../ports/outbound/repository/i-consumed-message-repository.js";
import type { ILogger } from "../logger/i-logger.js";
import { WaitForMessageConsumer } from "./wait-for-message-consumer.js";

describe("WaitForMessageConsumer", () => {
    const mockConsumedMessageRepository = mock<IConsumedMessageRepository>({
        checkIfMessageIsConsumed: vi.fn()
    });

    const mockLogger = mock<ILogger>();

    const defaultOptions = {
        consumedMessageRepository: mockConsumedMessageRepository,
        logger: mockLogger,
        pollingInterval: 10
    };

    beforeEach(() => {
        mockReset(mockConsumedMessageRepository);
        mockReset(mockLogger);
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("should resolve immediately if no message IDs are provided", async () => {
        const consumer = new WaitForMessageConsumer(defaultOptions);

        await consumer.waitForMessagesToBeConsumed("consumer-id");

        expect(mockConsumedMessageRepository.checkIfMessageIsConsumed).not.toHaveBeenCalled();
    });

    it("should resolve when all messages are consumed", async () => {
        vi.spyOn(mockConsumedMessageRepository, "checkIfMessageIsConsumed")
            .mockResolvedValueOnce(true)
            .mockResolvedValueOnce(true);

        const consumer = new WaitForMessageConsumer(defaultOptions);

        await consumer.waitForMessagesToBeConsumed("consumer-id", "message-1", "message-2");

        expect(mockConsumedMessageRepository.checkIfMessageIsConsumed).toHaveBeenCalledTimes(2);
    });

    it("should handle polling interval correctly", async () => {
        vi.spyOn(mockConsumedMessageRepository, "checkIfMessageIsConsumed")
            .mockResolvedValueOnce(false)
            .mockResolvedValueOnce(true)
            .mockResolvedValueOnce(true);

        const consumer = new WaitForMessageConsumer(defaultOptions);

        const waitForMessagesToBeConsumedPromise = consumer.waitForMessagesToBeConsumed(
            "consumer-id",
            "message-1",
            "message-2"
        );

        await vi.advanceTimersByTimeAsync(10);

        await waitForMessagesToBeConsumedPromise;

        expect(mockConsumedMessageRepository.checkIfMessageIsConsumed).toHaveBeenCalledTimes(3);
    });
});
