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
import type { ITransactionManager } from "../../ports/outbound/transaction-manager/i-transaction-manager.js";
import type { Constructor } from "../../types/constructor.type.js";
import type { AggregateQueryService } from "../aggregate-query-service/aggregate-query-service.js";
import { aggregateSnapshotTransformer } from "../aggregate-snapshot-transformer/aggregate-snapshot-transformer.js";
import type { ILogger } from "../logger/i-logger.js";
import { AggregateFactory, type AggregateFactoryOptions } from "./aggregate-factory.js";
import { AggregateMetadataNotFoundError } from "./errors/aggregate-metadata-not-found.error.js";

describe("AggregateFactory", () => {
    const mockAggregateClass = vi.fn();
    const mockTransactionManager = mock<ITransactionManager>({
        transaction: (fn) => fn({})
    });
    const mockDomainEventRepository = mock<IDomainEventRepository>();
    const mockSnapshotRepository = mock<ISnapshotRepository>();
    const mockExternalOriginMap = mock<Map<string, AggregateQueryService>>();
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
        mockReset(mockLogger);

        vi.clearAllMocks();

        aggregateMetadataRegistry.getAggregateMetadata = vi.fn(() => mockAggregateMetadata);
        aggregateSnapshotTransformer.restoreFromSnapshot = vi.fn();
        domainEventDeserializer.deserializeDomainEvents = vi.fn();
        aggregateDomainEventApplier.applyDomainEventToAggregate = vi.fn();
    });

    function createFactory(overrides: Partial<AggregateFactoryOptions<any>> = {}) {
        return new AggregateFactory({
            aggregateClass: mockAggregateClass,
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
                createFactory();
            }).toThrow(AggregateMetadataNotFoundError);
        });

        it("should construct a valid instance", () => {
            const factory = createFactory();

            expect(factory).toBeDefined();
        });
    });

    describe("buildFromEventLog", () => {
        it("should build the aggregate from the event log", async () => {
            const factory = createFactory();

            const mockSerializedEvents = [
                { id: faker.string.uuid(), sequenceNumber: 1 },
                { id: faker.string.uuid(), sequenceNumber: 2 }
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

            mockAggregateClass.mockReturnValueOnce(mockAggregateInstance);

            const result = await factory.buildFromEventLog(aggregateId);

            expect(mockDomainEventRepository.getAggregateDomainEvents).toHaveBeenCalledWith(
                factory.getTransactionContext(),
                "TestOrigin",
                "TestType",
                aggregateId,
                undefined
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

        it("should build the aggregate from the event log (with tenant ID if provided)", async () => {
            const factory = createFactory({
                tenantId: "TestTenant"
            });

            const mockSerializedEvents = [
                { id: faker.string.uuid(), sequenceNumber: 1 },
                { id: faker.string.uuid(), sequenceNumber: 2 }
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

            mockAggregateClass.mockReturnValueOnce(mockAggregateInstance);

            const result = await factory.buildFromEventLog(aggregateId);

            expect(mockDomainEventRepository.getAggregateDomainEvents).toHaveBeenCalledWith(
                factory.getTransactionContext(),
                "TestOrigin",
                "TestType",
                aggregateId,
                "TestTenant"
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
            const factory = createFactory();

            mockDomainEventRepository.getAggregateDomainEvents.mockResolvedValue([]);

            const result = await factory.buildFromEventLog(faker.string.uuid());

            expect(result).toBeNull();
        });

        it("should return null if the aggregate is external and the event log is empty", async () => {
            aggregateMetadataRegistry.getAggregateMetadata = vi.fn(
                () =>
                    ({
                        type: "TestType",
                        isInternal: false,
                        origin: "ExternalOrigin"
                    }) as const
            );

            const factory = createFactory({
                currentOrigin: "ExternalOrigin"
            });

            mockDomainEventRepository.getAggregateDomainEvents.mockResolvedValue([]);

            const result = await factory.buildFromEventLog(faker.string.uuid());

            expect(result).toBeNull();
        });

        it("should return null if the aggregate is external and the log is incomplete", async () => {
            aggregateMetadataRegistry.getAggregateMetadata = vi.fn(
                () =>
                    ({
                        type: "TestType",
                        isInternal: false,
                        origin: "ExternalOrigin"
                    }) as const
            );

            const factory = createFactory({
                currentOrigin: "ExternalOrigin"
            });

            mockDomainEventRepository.getAggregateDomainEvents.mockResolvedValue([
                {
                    id: faker.string.uuid(),
                    sequenceNumber: 2 // Starting from 2, indicating an incomplete log
                }
            ] as SerializedDomainEvent[]);

            const result = await factory.buildFromEventLog(faker.string.uuid());

            expect(result).toBeNull();
        });

        it("should attempt to fetch events from the external origin if the origin is provided in the externalOriginMap and the event log is empty", async () => {
            aggregateMetadataRegistry.getAggregateMetadata = vi.fn(
                () =>
                    ({
                        type: "TestType",
                        isInternal: false,
                        origin: "ExternalOrigin"
                    }) as const
            );

            const mockAggregateQueryService = mock<AggregateQueryService>();
            mockAggregateQueryService.getDomainEventsForAggregate.mockResolvedValueOnce([]);
            mockExternalOriginMap.has.mockReturnValueOnce(true);
            mockExternalOriginMap.get.mockReturnValueOnce(mockAggregateQueryService);

            const factory = createFactory({
                externalOriginMap: mockExternalOriginMap
            });

            mockDomainEventRepository.getAggregateDomainEvents.mockResolvedValue([]);

            const aggregateId = faker.string.uuid();

            const result = await factory.buildFromEventLog(aggregateId);

            expect(mockExternalOriginMap.has).toHaveBeenCalledWith("ExternalOrigin");
            expect(mockExternalOriginMap.get).toHaveBeenCalledWith("ExternalOrigin");
            expect(mockAggregateQueryService.getDomainEventsForAggregate).toHaveBeenCalledWith(
                "ExternalOrigin",
                "TestType",
                aggregateId,
                undefined
            );
            expect(result).toBeNull();
        });

        it("should attempt to fetch events from the external origin if the origin is provided in the externalOriginMap and the event log is empty (with tenant ID if provided)", async () => {
            aggregateMetadataRegistry.getAggregateMetadata = vi.fn(
                () =>
                    ({
                        type: "TestType",
                        isInternal: false,
                        origin: "ExternalOrigin"
                    }) as const
            );

            const mockAggregateQueryService = mock<AggregateQueryService>();
            mockAggregateQueryService.getDomainEventsForAggregate.mockResolvedValueOnce([]);
            mockExternalOriginMap.has.mockReturnValueOnce(true);
            mockExternalOriginMap.get.mockReturnValueOnce(mockAggregateQueryService);

            const factory = createFactory({
                externalOriginMap: mockExternalOriginMap,
                currentOrigin: "ExternalOrigin",
                tenantId: "TestTenant"
            });

            mockDomainEventRepository.getAggregateDomainEvents.mockResolvedValue([]);

            const aggregateId = faker.string.uuid();

            const result = await factory.buildFromEventLog(aggregateId);

            expect(mockExternalOriginMap.has).toHaveBeenCalledWith("ExternalOrigin");
            expect(mockExternalOriginMap.get).toHaveBeenCalledWith("ExternalOrigin");
            expect(mockAggregateQueryService.getDomainEventsForAggregate).toHaveBeenCalledWith(
                "ExternalOrigin",
                "TestType",
                aggregateId,
                "TestTenant"
            );
            expect(result).toBeNull();
        });

        it("should attempt to fetch events from the external origin if the origin is provided in the externalOriginMap and the event log is incomplete", async () => {
            aggregateMetadataRegistry.getAggregateMetadata = vi.fn(
                () =>
                    ({
                        type: "TestType",
                        isInternal: false,
                        origin: "ExternalOrigin"
                    }) as const
            );

            const mockAggregateQueryService = mock<AggregateQueryService>();
            mockAggregateQueryService.getDomainEventsForAggregate.mockResolvedValueOnce([]);
            mockExternalOriginMap.has.mockReturnValueOnce(true);
            mockExternalOriginMap.get.mockReturnValueOnce(mockAggregateQueryService);

            const factory = createFactory({
                externalOriginMap: mockExternalOriginMap,
                currentOrigin: "ExternalOrigin"
            });

            mockDomainEventRepository.getAggregateDomainEvents.mockResolvedValue([
                {
                    id: faker.string.uuid(),
                    sequenceNumber: 2 // Starting from 2, indicating an incomplete log
                }
            ] as SerializedDomainEvent[]);

            const aggregateId = faker.string.uuid();

            const result = await factory.buildFromEventLog(aggregateId);

            expect(mockExternalOriginMap.has).toHaveBeenCalledWith("ExternalOrigin");
            expect(mockExternalOriginMap.get).toHaveBeenCalledWith("ExternalOrigin");
            expect(mockAggregateQueryService.getDomainEventsForAggregate).toHaveBeenCalledWith(
                "ExternalOrigin",
                "TestType",
                aggregateId,
                undefined
            );
            expect(result).toBeNull();
        });

        it("should attempt to fetch events from the external origin if the origin is provided in the externalOriginMap and the event log is incomplete (with tenant ID if provided)", async () => {
            aggregateMetadataRegistry.getAggregateMetadata = vi.fn(
                () =>
                    ({
                        type: "TestType",
                        isInternal: false,
                        origin: "ExternalOrigin"
                    }) as const
            );

            const mockAggregateQueryService = mock<AggregateQueryService>();
            mockAggregateQueryService.getDomainEventsForAggregate.mockResolvedValueOnce([]);
            mockExternalOriginMap.has.mockReturnValueOnce(true);
            mockExternalOriginMap.get.mockReturnValueOnce(mockAggregateQueryService);

            const factory = createFactory({
                externalOriginMap: mockExternalOriginMap,
                currentOrigin: "ExternalOrigin",
                tenantId: "TestTenant"
            });

            mockDomainEventRepository.getAggregateDomainEvents.mockResolvedValue([
                {
                    id: faker.string.uuid(),
                    sequenceNumber: 2 // Starting from 2, indicating an incomplete log
                }
            ] as SerializedDomainEvent[]);

            const aggregateId = faker.string.uuid();

            const result = await factory.buildFromEventLog(aggregateId);

            expect(mockExternalOriginMap.has).toHaveBeenCalledWith("ExternalOrigin");
            expect(mockExternalOriginMap.get).toHaveBeenCalledWith("ExternalOrigin");
            expect(mockAggregateQueryService.getDomainEventsForAggregate).toHaveBeenCalledWith(
                "ExternalOrigin",
                "TestType",
                aggregateId,
                "TestTenant"
            );
            expect(result).toBeNull();
        });

        it("should not attempt to fetch events from the external origin if events are found in the log and are complete", async () => {
            aggregateMetadataRegistry.getAggregateMetadata = vi.fn(
                () =>
                    ({
                        type: "TestType",
                        isInternal: false,
                        origin: "ExternalOrigin"
                    }) as const
            );

            const mockAggregateQueryService = mock<AggregateQueryService>();
            mockExternalOriginMap.has.mockReturnValueOnce(true);

            const factory = createFactory({
                currentOrigin: "ExternalOrigin"
            });

            const aggregateId = faker.string.uuid();
            const mockSerializedEvents = [
                { id: faker.string.uuid(), sequenceNumber: 1 },
                { id: faker.string.uuid(), sequenceNumber: 2 }
            ] as SerializedDomainEvent[];

            mockDomainEventRepository.getAggregateDomainEvents.mockResolvedValueOnce(mockSerializedEvents);

            domainEventDeserializer.deserializeDomainEvents = vi.fn(
                () => mockSerializedEvents as unknown as AbstractDomainEvent[]
            );

            const mockAggregateInstance = {
                getId: vi.fn().mockReturnValue(aggregateId),
                setId: vi.fn().mockReturnThis()
            } as unknown as InstanceType<typeof AbstractAggregateRoot>;

            mockAggregateClass.mockReturnValueOnce(mockAggregateInstance);

            const result = await factory.buildFromEventLog(aggregateId);

            expect(mockExternalOriginMap.has).not.toHaveBeenCalledWith("ExternalOrigin");
            expect(mockAggregateQueryService.getDomainEventsForAggregate).not.toHaveBeenCalled();
            expect(result).toBeDefined();
        });
    });

    describe("buildFromLatestSnapshot", () => {
        it("should build the aggregate from the latest snapshot", async () => {
            const factory = createFactory({
                currentOrigin: "CurrentOrigin"
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
                factory.getTransactionContext(),
                "TestOrigin",
                "TestType",
                aggregateId,
                undefined
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

        it("should build the aggregate from the latest snapshot (with tenant ID if provided)", async () => {
            const factory = createFactory({
                tenantId: "TestTenant"
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
                factory.getTransactionContext(),
                "TestOrigin",
                "TestType",
                aggregateId,
                "TestTenant"
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
            const factory = createFactory();

            mockSnapshotRepository.getLatestSnapshot.mockResolvedValueOnce(null);

            const result = await factory.buildFromLatestSnapshot(faker.string.uuid());

            expect(result).toBeNull();
        });
    });
});
