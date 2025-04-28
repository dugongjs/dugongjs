import { faker } from "@faker-js/faker";
import { mock, mockReset } from "vitest-mock-extended";
import { AbstractAggregateRoot } from "../../domain/abstract-aggregate-root/abstract-aggregate-root.js";
import type { AbstractDomainEvent } from "../../domain/abstract-domain-event/abstract-domain-event.js";
import type { SerializedDomainEvent } from "../../domain/abstract-domain-event/serialized-domain-event.js";
import { aggregateDomainEventApplier } from "../../domain/aggregate-domain-event-applier/aggregate-domain-event-applier.js";
import {
    aggregateMetadataRegistry,
    type AggregateMetadata
} from "../../domain/aggregate-metadata-registry/aggregate-metadata-registry.js";
import { domainEventDeserializer } from "../../domain/domain-event-deserializer/domain-event-deserializer.js";
import type { IDomainEventRepository } from "../../ports/outbound/repository/i-domain-event-repository.js";
import type { ISnapshotRepository, SerializedSnapshot } from "../../ports/outbound/repository/i-snapshot-repository.js";
import type { TransactionContext } from "../../ports/outbound/transaction-manager/i-transaction-manager.js";
import type { Constructor } from "../../types/constructor.type.js";
import { aggregateSnapshotTransformer } from "../aggregate-snapshot-transformer/aggregate-snapshot-transformer.js";
import type { ILogger } from "../logger/i-logger.js";
import { AggregateFactory } from "./aggregate-factory.js";
import { AggregateMetadataNotFoundError } from "./errors/aggregate-metadata-not-found.error.js";

describe("AggregateFactory", () => {
    const mockAggregateClass = vi.fn();
    const mockTransactionContext = mock<TransactionContext>();
    const mockDomainEventRepository = mock<IDomainEventRepository>();
    const mockSnapshotRepository = mock<ISnapshotRepository>();
    const mockLogger = mock<ILogger>();

    const mockAggregateMetadata: AggregateMetadata = {
        isInternal: false,
        origin: "TestOrigin",
        type: "TestType"
    };

    beforeEach(() => {
        mockReset(mockTransactionContext);
        mockReset(mockDomainEventRepository);
        mockReset(mockSnapshotRepository);
        mockReset(mockLogger);

        vi.clearAllMocks();

        aggregateMetadataRegistry.getAggregateMetadata = vi.fn(() => mockAggregateMetadata);
        aggregateSnapshotTransformer.restoreFromSnapshot = vi.fn();
        domainEventDeserializer.deserializeDomainEvents = vi.fn();
        aggregateDomainEventApplier.applyDomainEventToAggregate = vi.fn();
    });

    describe("constructor", () => {
        it("should throw AggregateMetadataNotFoundError if metadata is not found", () => {
            aggregateMetadataRegistry.getAggregateMetadata = vi.fn(() => null);

            expect(() => {
                new AggregateFactory({
                    aggregateClass: mockAggregateClass,
                    transactionContext: mockTransactionContext,
                    domainEventRepository: mockDomainEventRepository,
                    snapshotRepository: mockSnapshotRepository,
                    currentOrigin: "CurrentOrigin",
                    logger: mockLogger
                });
            }).toThrow(AggregateMetadataNotFoundError);
        });

        it("should construct a valid instance", () => {
            const factory = new AggregateFactory({
                aggregateClass: mockAggregateClass,
                transactionContext: mockTransactionContext,
                domainEventRepository: mockDomainEventRepository,
                snapshotRepository: mockSnapshotRepository,
                currentOrigin: "CurrentOrigin",
                logger: mockLogger
            });

            expect(factory).toBeDefined();
        });
    });

    describe("buildFromEventLog", () => {
        it("should build the aggregate from the event log", async () => {
            const factory = new AggregateFactory({
                aggregateClass: mockAggregateClass,
                transactionContext: mockTransactionContext,
                domainEventRepository: mockDomainEventRepository,
                snapshotRepository: mockSnapshotRepository,
                currentOrigin: "CurrentOrigin",
                logger: mockLogger
            });

            const mockSerializedEvents = [
                { id: faker.string.uuid() },
                { id: faker.string.uuid() }
            ] as SerializedDomainEvent[];

            mockDomainEventRepository.getAggregateDomainEvents.mockResolvedValueOnce(mockSerializedEvents);

            domainEventDeserializer.deserializeDomainEvents = vi.fn(
                () => mockSerializedEvents as unknown as AbstractDomainEvent[]
            );

            const aggregateId = faker.string.uuid();

            const mockAggregateInstance = {
                getId: vi.fn().mockReturnValue(aggregateId),
                setId: vi.fn().mockReturnThis()
            } as unknown as InstanceType<typeof AbstractAggregateRoot>;

            mockAggregateClass.mockImplementation(() => mockAggregateInstance);

            const result = await factory.buildFromEventLog(aggregateId);

            expect(mockDomainEventRepository.getAggregateDomainEvents).toHaveBeenCalledWith(
                mockTransactionContext,
                "TestOrigin",
                "TestType",
                aggregateId
            );
            expect(domainEventDeserializer.deserializeDomainEvents).toHaveBeenCalledWith(...mockSerializedEvents);
            expect(aggregateDomainEventApplier.applyDomainEventToAggregate).toHaveBeenCalledWith(
                mockAggregateInstance,
                mockSerializedEvents[0]
            );
            expect(aggregateDomainEventApplier.applyDomainEventToAggregate).toHaveBeenCalledWith(
                mockAggregateInstance,
                mockSerializedEvents[1]
            );
            expect(result).toBe(mockAggregateInstance);
        });

        it("should return null if no events are found in event log", async () => {
            const factory = new AggregateFactory({
                aggregateClass: mockAggregateClass,
                transactionContext: mockTransactionContext,
                domainEventRepository: mockDomainEventRepository,
                snapshotRepository: mockSnapshotRepository,
                currentOrigin: "CurrentOrigin",
                logger: mockLogger
            });

            mockDomainEventRepository.getAggregateDomainEvents.mockResolvedValue([]);

            const result = await factory.buildFromEventLog(faker.string.uuid());

            expect(result).toBeNull();
        });
    });

    describe("buildFromLatestSnapshot", () => {
        it("should build the aggregate from the latest snapshot", async () => {
            const factory = new AggregateFactory({
                aggregateClass: mockAggregateClass,
                transactionContext: mockTransactionContext,
                domainEventRepository: mockDomainEventRepository,
                snapshotRepository: mockSnapshotRepository,
                currentOrigin: "CurrentOrigin",
                logger: mockLogger
            });

            const aggregateId = faker.string.uuid();

            const mockSerializedEvents = [
                { id: faker.string.uuid() },
                { id: faker.string.uuid() }
            ] as SerializedDomainEvent[];

            mockDomainEventRepository.getAggregateDomainEvents.mockResolvedValueOnce(mockSerializedEvents);
            domainEventDeserializer.deserializeDomainEvents = vi.fn(
                () => mockSerializedEvents as unknown as AbstractDomainEvent[]
            );

            const latestSnapshot: SerializedSnapshot = {
                domainEventSequenceNumber: 1,
                origin: "CurrentOrigin",
                aggregateType: "TestType",
                aggregateId: aggregateId,
                snapshotData: {}
            };

            mockSnapshotRepository.getLatestSnapshot.mockResolvedValueOnce(latestSnapshot);

            const mockAggregateInstance = {
                getId: vi.fn().mockReturnValue(aggregateId),
                setId: vi.fn().mockReturnThis()
            } as unknown as InstanceType<typeof AbstractAggregateRoot>;

            aggregateSnapshotTransformer.restoreFromSnapshot = vi.fn(
                <TAggregateRootClass extends Constructor<AbstractAggregateRoot>>(
                    aggregateClass: TAggregateRootClass,
                    snapshot: SerializedSnapshot
                ): InstanceType<TAggregateRootClass> => mockAggregateInstance as InstanceType<TAggregateRootClass>
            );

            const result = await factory.buildFromLatestSnapshot(aggregateId);

            expect(mockSnapshotRepository.getLatestSnapshot).toHaveBeenCalledWith(
                mockTransactionContext,
                "TestOrigin",
                "TestType",
                aggregateId
            );
            expect(domainEventDeserializer.deserializeDomainEvents).toHaveBeenCalledWith(...mockSerializedEvents);
            expect(aggregateDomainEventApplier.applyDomainEventToAggregate).toHaveBeenCalledWith(
                mockAggregateInstance,
                mockSerializedEvents[0]
            );
            expect(aggregateDomainEventApplier.applyDomainEventToAggregate).toHaveBeenCalledWith(
                mockAggregateInstance,
                mockSerializedEvents[1]
            );
            expect(result).toBe(mockAggregateInstance);
        });

        it("should return null if no snapshot is found", async () => {
            const factory = new AggregateFactory({
                aggregateClass: mockAggregateClass,
                transactionContext: mockTransactionContext,
                domainEventRepository: mockDomainEventRepository,
                snapshotRepository: mockSnapshotRepository,
                currentOrigin: "CurrentOrigin",
                logger: mockLogger
            });

            mockSnapshotRepository.getLatestSnapshot.mockResolvedValueOnce(null);

            const result = await factory.buildFromLatestSnapshot(faker.string.uuid());

            expect(result).toBeNull();
        });
    });
});
