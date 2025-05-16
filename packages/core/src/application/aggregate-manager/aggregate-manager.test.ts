import { faker } from "@faker-js/faker";
import { mock, mockReset } from "vitest-mock-extended";
import { aggregateDomainEventApplier } from "../../domain/aggregate-domain-event-applier/aggregate-domain-event-applier.js";
import {
    aggregateMetadataRegistry,
    type AggregateMetadata
} from "../../domain/aggregate-metadata-registry/aggregate-metadata-registry.js";
import type { IOutboundMessageMapper } from "../../ports/index.js";
import type { IMessageProducer } from "../../ports/outbound/message-broker/i-message-producer.js";
import type { IDomainEventRepository } from "../../ports/outbound/repository/i-domain-event-repository.js";
import type { ISnapshotRepository } from "../../ports/outbound/repository/i-snapshot-repository.js";
import type { ITransactionManager } from "../../ports/outbound/transaction-manager/i-transaction-manager.js";
import { AggregateMetadataNotFoundError } from "../aggregate-factory/errors/aggregate-metadata-not-found.error.js";
import { aggregateSnapshotTransformer } from "../aggregate-snapshot-transformer/aggregate-snapshot-transformer.js";
import type { ILogger } from "../logger/i-logger.js";
import { AggregateManager } from "./aggregate-manager.js";
import { MissingProducerOrMapperError } from "./errors/missing-producer-or-mapper.error.js";

describe("AggregateManager", () => {
    const mockAggregateClass = vi.fn();
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
        mockReset(mockTransactionManager);
        mockReset(mockDomainEventRepository);
        mockReset(mockSnapshotRepository);
        mockReset(mockMessageProducer);
        mockReset(mockOutboundMessageMapper);
        mockReset(mockLogger);

        vi.clearAllMocks();

        aggregateMetadataRegistry.getAggregateMetadata = vi.fn(() => mockAggregateMetadata);
        aggregateSnapshotTransformer.takeSnapshot = vi.fn();
        aggregateDomainEventApplier.applyStagedDomainEventsToAggregate = vi.fn();
    });

    describe("constructor", () => {
        it("should throw AggregateMetadataNotFoundError if metadata is not found", () => {
            aggregateMetadataRegistry.getAggregateMetadata = vi.fn(() => null);

            expect(() => {
                new AggregateManager({
                    aggregateClass: mockAggregateClass,
                    transactionManager: mockTransactionManager,
                    domainEventRepository: mockDomainEventRepository,
                    snapshotRepository: mockSnapshotRepository,
                    messageProducer: mockMessageProducer,
                    outboundMessageMapper: mockOutboundMessageMapper,
                    currentOrigin: "CurrentOrigin",
                    logger: mockLogger
                });
            }).toThrow(AggregateMetadataNotFoundError);
        });

        it("should throw an error if messageProducer is set without outboundMessageMapper", () => {
            expect(() => {
                new AggregateManager({
                    aggregateClass: mockAggregateClass,
                    transactionManager: mockTransactionManager,
                    domainEventRepository: mockDomainEventRepository,
                    snapshotRepository: mockSnapshotRepository,
                    messageProducer: mockMessageProducer,
                    outboundMessageMapper: undefined,
                    currentOrigin: "CurrentOrigin",
                    logger: mockLogger
                });
            }).toThrow(MissingProducerOrMapperError);
        });

        it("should construct a valid instance", () => {
            const manager = new AggregateManager({
                aggregateClass: mockAggregateClass,
                transactionManager: mockTransactionManager,
                domainEventRepository: mockDomainEventRepository,
                snapshotRepository: mockSnapshotRepository,
                messageProducer: mockMessageProducer,
                outboundMessageMapper: mockOutboundMessageMapper,
                currentOrigin: "CurrentOrigin",
                logger: mockLogger
            });

            expect(manager).toBeDefined();
        });
    });

    describe("applyStagedDomainEvents", () => {
        it("should apply staged domain events to the aggregate", () => {
            const mockAggregate = { getStagedDomainEvents: vi.fn().mockReturnValue([]) } as any;

            const manager = new AggregateManager({
                aggregateClass: mockAggregateClass,
                transactionManager: mockTransactionManager,
                domainEventRepository: mockDomainEventRepository,
                snapshotRepository: mockSnapshotRepository,
                messageProducer: mockMessageProducer,
                outboundMessageMapper: mockOutboundMessageMapper,
                currentOrigin: "CurrentOrigin",
                logger: mockLogger
            });

            manager.applyStagedDomainEvents(mockAggregate);

            expect(aggregateDomainEventApplier.applyStagedDomainEventsToAggregate).toHaveBeenCalledWith(mockAggregate);
        });
    });

    describe("commitStagedDomainEvents", () => {
        it("should not commit if there are no staged domain events", async () => {
            const mockAggregate = {
                getId: vi.fn(() => "aggregate-id"),
                getStagedDomainEvents: vi.fn(() => []),
                clearStagedDomainEvents: vi.fn()
            } as any;

            const manager = new AggregateManager({
                aggregateClass: mockAggregateClass,
                transactionManager: mockTransactionManager,
                domainEventRepository: mockDomainEventRepository,
                snapshotRepository: mockSnapshotRepository,
                outboundMessageMapper: mockOutboundMessageMapper,
                messageProducer: mockMessageProducer,
                currentOrigin: "CurrentOrigin",
                logger: mockLogger
            });

            await manager.commitStagedDomainEvents(mockAggregate);

            expect(mockDomainEventRepository.saveDomainEvents).not.toHaveBeenCalled();
        });

        it("should commit staged domain events and publish them if a message producer and outbound message mapper is provided", async () => {
            const mockDomainEvent = {
                serialize: vi.fn(() => "serialized-event"),
                setCorrelationId: vi.fn(),
                setTriggeredByUserId: vi.fn(),
                setTriggeredByEventId: vi.fn()
            };
            const mockAggregate = {
                getId: vi.fn(() => "aggregate-id"),
                getStagedDomainEvents: vi.fn(() => [mockDomainEvent]),
                clearStagedDomainEvents: vi.fn()
            } as any;

            const manager = new AggregateManager({
                aggregateClass: mockAggregateClass,
                transactionManager: mockTransactionManager,
                domainEventRepository: mockDomainEventRepository,
                snapshotRepository: mockSnapshotRepository,
                messageProducer: mockMessageProducer,
                outboundMessageMapper: mockOutboundMessageMapper,
                currentOrigin: "CurrentOrigin",
                logger: mockLogger
            });

            const correlationId = faker.string.uuid();
            const triggeredByUserId = faker.string.uuid();
            const triggeredByEventId = faker.string.uuid();

            await manager.commitStagedDomainEvents(mockAggregate, {
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
            expect(mockAggregate.clearStagedDomainEvents).toHaveBeenCalled();
        });
    });

    describe("createSnapshotIfNecessary", () => {
        it("should not create a snapshot if the aggregate is not snapshotable", async () => {
            const mockAggregate = {
                getId: vi.fn(() => "aggregate-id"),
                getCurrentDomainEventSequenceNumber: vi.fn(() => 5)
            } as any;

            const manager = new AggregateManager({
                aggregateClass: mockAggregateClass,
                transactionManager: mockTransactionManager,
                domainEventRepository: mockDomainEventRepository,
                snapshotRepository: mockSnapshotRepository,
                messageProducer: mockMessageProducer,
                outboundMessageMapper: mockOutboundMessageMapper,
                currentOrigin: "CurrentOrigin",
                logger: mockLogger
            });

            await manager["createSnapshotIfNecessary"](mockAggregate);

            expect(mockSnapshotRepository.saveSnapshot).not.toHaveBeenCalled();
        });

        it("should not create a snapshot if the interval is not met", async () => {
            const mockAggregate = {
                getId: vi.fn(() => "aggregate-id"),
                getCurrentDomainEventSequenceNumber: vi.fn(() => 10)
            } as any;

            aggregateMetadataRegistry.getAggregateSnapshotMetadata = vi.fn(() => ({
                isSnapshotable: true,
                snapshotInterval: 20
            }));

            const manager = new AggregateManager({
                aggregateClass: mockAggregateClass,
                transactionManager: mockTransactionManager,
                domainEventRepository: mockDomainEventRepository,
                snapshotRepository: mockSnapshotRepository,
                messageProducer: mockMessageProducer,
                outboundMessageMapper: mockOutboundMessageMapper,
                currentOrigin: "CurrentOrigin",
                logger: mockLogger
            });

            await manager["createSnapshotIfNecessary"](mockAggregate);

            expect(aggregateSnapshotTransformer.takeSnapshot).not.toHaveBeenCalledWith(mockAggregate);
            expect(mockSnapshotRepository.saveSnapshot).not.toHaveBeenCalled();
        });

        it("should create a snapshot if the aggregate is snapshotable and the interval is met", async () => {
            const mockAggregate = {
                getId: vi.fn(() => "aggregate-id"),
                getCurrentDomainEventSequenceNumber: vi.fn(() => 10)
            } as any;

            aggregateMetadataRegistry.getAggregateSnapshotMetadata = vi.fn(() => ({
                isSnapshotable: true,
                snapshotInterval: 10
            }));

            const manager = new AggregateManager({
                aggregateClass: mockAggregateClass,
                transactionManager: mockTransactionManager,
                domainEventRepository: mockDomainEventRepository,
                snapshotRepository: mockSnapshotRepository,
                messageProducer: mockMessageProducer,
                outboundMessageMapper: mockOutboundMessageMapper,
                currentOrigin: "CurrentOrigin",
                logger: mockLogger
            });

            await manager["createSnapshotIfNecessary"](mockAggregate);

            expect(aggregateSnapshotTransformer.takeSnapshot).toHaveBeenCalledWith(
                "TestOrigin",
                "TestType",
                mockAggregate
            );
            expect(mockSnapshotRepository.saveSnapshot).toHaveBeenCalled();
        });
    });
});
