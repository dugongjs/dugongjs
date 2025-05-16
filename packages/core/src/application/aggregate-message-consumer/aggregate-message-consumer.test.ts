import { faker } from "@faker-js/faker";
import { mock, mockReset } from "vitest-mock-extended";
import type { AbstractDomainEvent } from "../../domain/abstract-domain-event/abstract-domain-event.js";
import type { SerializedDomainEvent } from "../../domain/abstract-domain-event/serialized-domain-event.js";
import { aggregateMetadataRegistry } from "../../domain/aggregate-metadata-registry/aggregate-metadata-registry.js";
import { domainEventDeserializer } from "../../domain/domain-event-deserializer/domain-event-deserializer.js";
import type { IMessageConsumer } from "../../ports/inbound/message-broker/i-message-consumer.js";
import type { IInboundMessageMapper } from "../../ports/index.js";
import type { IConsumedMessageRepository } from "../../ports/outbound/repository/i-consumed-message-repository.js";
import type { IDomainEventRepository } from "../../ports/outbound/repository/i-domain-event-repository.js";
import type {
    ITransactionManager,
    TransactionContext
} from "../../ports/outbound/transaction-manager/i-transaction-manager.js";
import type { ILogger } from "../logger/i-logger.js";
import { AggregateMessageConsumer, type AggregateMessageConsumerOptions } from "./aggregate-message-consumer.js";

describe("AggregateMessageConsumer", () => {
    const mockTransactionManager = mock<ITransactionManager>();
    const mockDomainEventRepository = mock<IDomainEventRepository>();
    const mockConsumedMessageRepository = mock<IConsumedMessageRepository>();
    const mockLogger = mock<ILogger>();
    const mockInboundMessageMapper = mock<IInboundMessageMapper<any>>();
    const mockMessageConsumer = mock<IMessageConsumer<any>>();

    beforeEach(() => {
        mockReset(mockTransactionManager);
        mockReset(mockDomainEventRepository);
        mockReset(mockConsumedMessageRepository);
        mockReset(mockInboundMessageMapper);
        mockReset(mockMessageConsumer);
        mockReset(mockLogger);
        mockReset(mockMessageConsumer);

        mockMessageConsumer.generateMessageChannelIdForAggregate.mockReturnValue("channel-id");
        mockMessageConsumer.generateMessageConsumerIdForAggregate.mockReturnValue("consumer-id");

        vi.clearAllMocks();

        vi.spyOn(domainEventDeserializer, "deserializeDomainEvents").mockReturnValue([mockDomainEvent]);
        vi.spyOn(aggregateMetadataRegistry, "getAggregateMetadata").mockReturnValue({
            isInternal: true,
            type: "TestAggregate"
        });
    });

    const options: AggregateMessageConsumerOptions<any, any> = {
        transactionManager: mockTransactionManager,
        domainEventRepository: mockDomainEventRepository,
        consumedMessageRepository: mockConsumedMessageRepository,
        messageConsumer: mockMessageConsumer,
        inboundMessageMapper: mockInboundMessageMapper,
        logger: mockLogger,
        aggregateClass: class {},
        currentOrigin: "TestOrigin"
    };

    const domainEventId = faker.string.uuid();

    const serializedDomainEvent: SerializedDomainEvent = {
        origin: "TestOrigin",
        aggregateType: "TestAggregate",
        type: "TestType",
        version: 1,
        id: domainEventId,
        aggregateId: faker.string.uuid(),
        payload: { key: faker.string.uuid() },
        sequenceNumber: 1,
        timestamp: faker.date.recent()
    };

    const mockDomainEvent = {
        getId: vi.fn(() => domainEventId),
        getContext: vi.fn(() => "AggregateContext"),
        getOrigin: vi.fn(() => "AggregateOrigin"),
        getAggregateType: vi.fn(() => "AggregateType"),
        getAggregateId: vi.fn(() => faker.string.uuid()),
        getType: vi.fn(() => "EventType"),
        getVersion: vi.fn(() => 1)
    } as unknown as AbstractDomainEvent;

    it("should register a message consumer and process messages", async () => {
        vi.spyOn(aggregateMetadataRegistry, "getAggregateMetadata").mockReturnValueOnce({
            isInternal: false,
            origin: "TestOrigin",
            type: "TestAggregate"
        });

        const consumer = new AggregateMessageConsumer(options);

        const mockMessage = { id: faker.string.uuid() };
        const handleMessage = vi.fn();

        mockInboundMessageMapper.map.mockReturnValue(serializedDomainEvent);
        mockConsumedMessageRepository.checkIfMessageIsConsumed.mockResolvedValue(false);

        mockTransactionManager.transaction.mockImplementation(async (fn) => {
            const transactionContext: TransactionContext = {};
            await fn(transactionContext);
        });

        await consumer.registerMessageConsumerForAggregate("TestConsumer", handleMessage);

        const messageHandler = mockMessageConsumer.registerDomainEventMessageConsumer.mock.calls[0][2];

        await messageHandler?.(mockMessage);

        expect(mockMessageConsumer.registerDomainEventMessageConsumer).toHaveBeenCalledWith(
            "channel-id",
            "consumer-id",
            expect.any(Function)
        );
        expect(mockInboundMessageMapper.map).toHaveBeenCalledWith(mockMessage);
        expect(domainEventDeserializer.deserializeDomainEvents).toHaveBeenCalledWith(serializedDomainEvent);
        expect(mockTransactionManager.transaction).toHaveBeenCalled();
        expect(mockConsumedMessageRepository.checkIfMessageIsConsumed).toHaveBeenCalledWith(
            expect.any(Object),
            domainEventId,
            "consumer-id"
        );
        expect(mockDomainEventRepository.saveDomainEvents).toHaveBeenCalledWith(expect.any(Object), [
            serializedDomainEvent
        ]);
        expect(mockConsumedMessageRepository.markMessageAsConsumed).toHaveBeenCalledWith(
            expect.any(Object),
            domainEventId,
            "consumer-id"
        );
        expect(handleMessage).toHaveBeenCalledWith({
            transactionContext: expect.any(Object),
            domainEvent: mockDomainEvent,
            message: mockMessage
        });
    });

    it("should skip processing if the message is already consumed", async () => {
        const consumer = new AggregateMessageConsumer(options);

        const mockMessage = { id: faker.string.uuid() };
        const handleMessage = vi.fn();

        mockInboundMessageMapper.map.mockReturnValue(serializedDomainEvent);
        mockConsumedMessageRepository.checkIfMessageIsConsumed.mockResolvedValue(true);

        mockTransactionManager.transaction.mockImplementation(async (fn) => {
            const transactionContext: TransactionContext = {};
            await fn(transactionContext);
        });

        await consumer.registerMessageConsumerForAggregate("TestConsumer", handleMessage);

        const messageHandler = mockMessageConsumer.registerDomainEventMessageConsumer.mock.calls[0][2];

        await messageHandler?.(mockMessage);

        expect(mockMessageConsumer.registerDomainEventMessageConsumer).toHaveBeenCalledWith(
            "channel-id",
            "consumer-id",
            expect.any(Function)
        );
        expect(mockInboundMessageMapper.map).toHaveBeenCalledWith(mockMessage);
        expect(domainEventDeserializer.deserializeDomainEvents).toHaveBeenCalledWith(serializedDomainEvent);
        expect(mockTransactionManager.transaction).toHaveBeenCalled();
        expect(mockConsumedMessageRepository.checkIfMessageIsConsumed).toHaveBeenCalledWith(
            expect.any(Object),
            domainEventId,
            "consumer-id"
        );
        expect(mockDomainEventRepository.saveDomainEvents).not.toHaveBeenCalled();
        expect(mockConsumedMessageRepository.markMessageAsConsumed).not.toHaveBeenCalled();
        expect(handleMessage).not.toHaveBeenCalled();
    });

    it("should skip persistence if skipPersistence option is set", async () => {
        const consumer = new AggregateMessageConsumer(options);

        const mockMessage = { id: faker.string.uuid() };
        const handleMessage = vi.fn();

        mockInboundMessageMapper.map.mockReturnValue(serializedDomainEvent);
        mockConsumedMessageRepository.checkIfMessageIsConsumed.mockResolvedValue(false);

        mockTransactionManager.transaction.mockImplementation(async (fn) => {
            const transactionContext: TransactionContext = {};
            await fn(transactionContext);
        });

        await consumer.registerMessageConsumerForAggregate("TestConsumer", handleMessage, { skipPersistence: true });

        const messageHandler = mockMessageConsumer.registerDomainEventMessageConsumer.mock.calls[0][2];

        await messageHandler?.(mockMessage);

        expect(mockDomainEventRepository.saveDomainEvents).not.toHaveBeenCalled();
    });

    it("should skip persistence if the aggregate is internal", async () => {
        vi.spyOn(aggregateMetadataRegistry, "getAggregateMetadata").mockReturnValueOnce({
            isInternal: true,
            type: "TestAggregate"
        });

        const consumer = new AggregateMessageConsumer(options);

        const mockMessage = { id: faker.string.uuid() };
        const handleMessage = vi.fn();

        mockInboundMessageMapper.map.mockReturnValue(serializedDomainEvent);
        mockConsumedMessageRepository.checkIfMessageIsConsumed.mockResolvedValue(false);

        mockTransactionManager.transaction.mockImplementation(async (fn) => {
            const transactionContext: TransactionContext = {};
            await fn(transactionContext);
        });

        await consumer.registerMessageConsumerForAggregate("TestConsumer", handleMessage);

        const messageHandler = mockMessageConsumer.registerDomainEventMessageConsumer.mock.calls[0][2];

        await messageHandler?.(mockMessage);

        expect(mockDomainEventRepository.saveDomainEvents).not.toHaveBeenCalled();
    });
});
