import { mock, mockReset } from "vitest-mock-extended";
import { AbstractAggregateRoot, Aggregate } from "../../domain/index.js";
import { IDomainEventRepository, IMessageConsumer, ITransactionManager } from "../../ports/index.js";
import type { IConsumedMessageRepository } from "../../ports/outbound/repository/i-consumed-message-repository.js";
import type { ILogger } from "../logger/i-logger.js";
import { WaitForMessageConsumer, type WaitForMessageConsumerOptions } from "./wait-for-message-consumer.js";

describe("WaitForMessageConsumer", () => {
    const mockTransactionManager = mock<ITransactionManager>({
        transaction: (fn) => fn({})
    });
    const mockDomainEventRepository = mock<IDomainEventRepository>();
    const mockConsumedMessageRepository = mock<IConsumedMessageRepository>({
        checkIfMessageIsConsumed: vi.fn()
    });
    const mockMessageConsumer = mock<IMessageConsumer<any>>({
        generateMessageConsumerIdForAggregate: vi.fn().mockReturnValue("consumer-id")
    });

    const mockLogger = mock<ILogger>();

    @Aggregate("Test")
    class TestAggregate extends AbstractAggregateRoot {}

    const defaultOptions: WaitForMessageConsumerOptions = {
        aggregateClass: TestAggregate,
        domainEventRepository: mockDomainEventRepository,
        consumedMessageRepository: mockConsumedMessageRepository,
        messageConsumer: mockMessageConsumer,
        currentOrigin: "TestOrigin",
        logger: mockLogger,
        pollingInterval: 10
    };

    beforeEach(() => {
        mockReset(mockTransactionManager);
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
        mockConsumedMessageRepository.checkIfMessageIsConsumed.mockResolvedValueOnce(true).mockResolvedValueOnce(true);

        const consumer = new WaitForMessageConsumer(defaultOptions);

        await consumer.waitForMessagesToBeConsumed("consumer-id", "message-1", "message-2");

        expect(mockConsumedMessageRepository.checkIfMessageIsConsumed).toHaveBeenCalledTimes(2);
    });

    it("should handle polling interval correctly", async () => {
        mockConsumedMessageRepository.checkIfMessageIsConsumed
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

    it("should wait for all domain events of an aggregate to be consumed", async () => {
        mockDomainEventRepository.getAggregateDomainEvents.mockResolvedValue([
            { id: "event-1" },
            { id: "event-2" }
        ] as any);

        mockConsumedMessageRepository.checkIfMessageIsConsumed.mockResolvedValueOnce(true).mockResolvedValueOnce(true);

        const consumer = new WaitForMessageConsumer(defaultOptions);

        await consumer.waitForAggregateDomainEventsToBeConsumed("consumer-id", "aggregate-id");

        expect(mockDomainEventRepository.getAggregateDomainEvents).toHaveBeenCalledWith(
            null,
            "TestOrigin",
            "Test",
            "aggregate-id",
            undefined
        );
        expect(mockConsumedMessageRepository.checkIfMessageIsConsumed).toHaveBeenCalledTimes(2);
        expect(mockLogger.verbose).toHaveBeenCalledWith("All messages consumed");
    });
});
