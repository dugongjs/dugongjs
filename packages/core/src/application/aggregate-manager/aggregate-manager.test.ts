import { faker } from "@faker-js/faker";
import { mock, mockReset } from "vitest-mock-extended";
import { aggregateDomainEventApplier } from "../../domain/aggregate-domain-event-applier/aggregate-domain-event-applier.js";
import {
    aggregateMetadataRegistry,
    type AggregateMetadata
} from "../../domain/aggregate-metadata-registry/aggregate-metadata-registry.js";
import { AbstractAggregateRoot, AbstractDomainEvent, IsInProcessContext } from "../../domain/index.js";
import type { IOutboundMessageMapper, ISnapshotRepository } from "../../ports/index.js";
import type { IMessageProducer } from "../../ports/outbound/message-broker/i-message-producer.js";
import type { IDomainEventRepository } from "../../ports/outbound/repository/i-domain-event-repository.js";
import type { ITransactionManager } from "../../ports/outbound/transaction-manager/i-transaction-manager.js";
import { AggregateMetadataNotFoundError } from "../aggregate-factory/errors/aggregate-metadata-not-found.error.js";
import type { ILogger } from "../logger/i-logger.js";
import { AggregateManager, type AggregateManagerOptions } from "./aggregate-manager.js";
import { MissingProducerOrMapperError } from "./errors/missing-producer-or-mapper.error.js";

describe("AggregateManager", () => {
    class MockAggregate extends AbstractAggregateRoot {}

    const mockTransactionManager = mock<ITransactionManager>({
        transaction: (fn) => fn({})
    });
    const mockDomainEventRepository = mock<IDomainEventRepository>();
    const mockSnapshotRepository = mock<ISnapshotRepository>();
    const mockMessageProducer = mock<IMessageProducer<any>>();
    const mockOutboundMessageMapper = mock<IOutboundMessageMapper<any>>();
    const mockLogger = mock<ILogger>();

    const mockAggregateMetadata: AggregateMetadata = {
        isInternal: false,
        origin: "TestOrigin",
        type: "TestType"
    };

    beforeEach(() => {
        aggregateMetadataRegistry.getAggregateMetadata = vi.fn(() => mockAggregateMetadata);
        aggregateDomainEventApplier.applyStagedDomainEventsToAggregate = vi.fn();
    });

    afterEach(() => {
        mockReset(mockTransactionManager);
        mockReset(mockDomainEventRepository);
        mockReset(mockSnapshotRepository);
        mockReset(mockMessageProducer);
        mockReset(mockOutboundMessageMapper);
        mockReset(mockLogger);
        vi.clearAllMocks();
    });

    function createManager(overrides: Partial<AggregateManagerOptions<any>> = {}) {
        return new AggregateManager({
            aggregateClass: MockAggregate,
            transactionManager: mockTransactionManager,
            domainEventRepository: mockDomainEventRepository,
            snapshotRepository: mockSnapshotRepository,
            currentOrigin: "CurrentOrigin",
            logger: mockLogger,
            ...overrides
        });
    }

    describe("constructor", () => {
        it("should throw AggregateMetadataNotFoundError if metadata is not found", () => {
            aggregateMetadataRegistry.getAggregateMetadata = vi.fn(() => null);

            expect(() => {
                createManager();
            }).toThrow(AggregateMetadataNotFoundError);
        });

        it("should throw an error if messageProducer is set without outboundMessageMapper", () => {
            expect(() => {
                createManager({
                    messageProducer: mockMessageProducer,
                    outboundMessageMapper: undefined
                });
            }).toThrow(MissingProducerOrMapperError);
        });

        it("should construct a valid instance", () => {
            const manager = createManager();
            expect(manager).toBeDefined();
        });
    });

    describe("applyStagedDomainEvents", () => {
        it("applies staged domain events to the aggregate", () => {
            const manager = createManager();
            const aggregate = new MockAggregate();

            manager.applyStagedDomainEvents(aggregate);

            expect(aggregateDomainEventApplier.applyStagedDomainEventsToAggregate).toHaveBeenCalledWith(aggregate);
        });
    });

    describe("commitStagedDomainEvents", () => {
        it("does nothing if there are no staged domain events", async () => {
            const manager = createManager();
            const aggregate = new MockAggregate();

            await manager.commitStagedDomainEvents(aggregate);

            expect(mockDomainEventRepository.saveDomainEvents).not.toHaveBeenCalled();
            expect(mockMessageProducer.publishMessages).not.toHaveBeenCalled();
            expect(mockSnapshotRepository.saveSnapshot).not.toHaveBeenCalled();
        });

        it("commits staged domain events and publishes messages", async () => {
            const manager = createManager({
                messageProducer: mockMessageProducer,
                outboundMessageMapper: mockOutboundMessageMapper
            });

            const correlationId = faker.string.uuid();
            const triggeredByUserId = faker.string.uuid();
            const triggeredByEventId = faker.string.uuid();

            const mockDomainEvent = mock<AbstractDomainEvent>({
                serialize: () => "serialized-event" as any
            });

            const aggregate = new MockAggregate();
            aggregate[IsInProcessContext] = true;
            aggregate.stageDomainEvent(mockDomainEvent);
            aggregate[IsInProcessContext] = false;

            await manager.commitStagedDomainEvents(aggregate, {
                correlationId,
                triggeredByUserId,
                triggeredByEventId
            });

            expect(mockDomainEvent.setCorrelationId).toHaveBeenCalledWith(correlationId);
            expect(mockDomainEvent.setTriggeredByUserId).toHaveBeenCalledWith(triggeredByUserId);
            expect(mockDomainEvent.setTriggeredByEventId).toHaveBeenCalledWith(triggeredByEventId);

            expect(mockDomainEventRepository.saveDomainEvents).toHaveBeenCalledWith(manager.getTransactionContext(), [
                "serialized-event"
            ]);

            expect(mockOutboundMessageMapper.map).toHaveBeenCalled();
            expect(mockMessageProducer.publishMessages).toHaveBeenCalled();

            expect(aggregate.getStagedDomainEvents().length).toBe(0);
        });
    });
});
