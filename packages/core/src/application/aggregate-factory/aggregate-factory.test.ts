import { faker } from "@faker-js/faker";
import { mock, mockReset } from "vitest-mock-extended";
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
import type { AggregateQueryService } from "../aggregate-query-service/aggregate-query-service.js";
import { aggregateSnapshotTransformer } from "../aggregate-snapshot-transformer/aggregate-snapshot-transformer.js";
import type { ILogger } from "../logger/i-logger.js";
import { AggregateFactory, type AggregateFactoryOptions } from "./aggregate-factory.js";
import { AggregateMetadataNotFoundError } from "./errors/aggregate-metadata-not-found.error.js";

describe("AggregateFactory", () => {
    class MockAggregate {
        private id!: string;

        setId(id: string) {
            this.id = id;
            return this;
        }

        getId() {
            return this.id;
        }

        isDeleted() {
            return false;
        }
    }

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

        vi.spyOn(aggregateSnapshotTransformer, "restoreFromSnapshot");
        vi.spyOn(domainEventDeserializer, "deserializeDomainEvents");
        vi.spyOn(aggregateDomainEventApplier, "applyDomainEventToAggregate").mockImplementation(
            (aggregate: any) => aggregate
        );
    });

    function createFactory(overrides: Partial<AggregateFactoryOptions<any>> = {}) {
        return new AggregateFactory({
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

            vi.spyOn(domainEventDeserializer, "deserializeDomainEvents").mockReturnValue(
                mockSerializedEvents as unknown as AbstractDomainEvent[]
            );

            const result = await factory.buildFromEventLog(faker.string.uuid());

            expect(domainEventDeserializer.deserializeDomainEvents).toHaveBeenCalledWith(...mockSerializedEvents);
            expect(aggregateDomainEventApplier.applyDomainEventToAggregate).toHaveBeenCalledTimes(2);
            expect(result).toBeDefined();
        });

        it("should build the aggregate from the event log (with tenant ID if provided)", async () => {
            const factory = createFactory({ tenantId: "TestTenant" });

            const mockSerializedEvents = [
                { id: faker.string.uuid(), sequenceNumber: 1 },
                { id: faker.string.uuid(), sequenceNumber: 2 }
            ] as SerializedDomainEvent[];

            mockDomainEventRepository.getAggregateDomainEvents.mockResolvedValueOnce(mockSerializedEvents);

            vi.spyOn(domainEventDeserializer, "deserializeDomainEvents").mockReturnValue(
                mockSerializedEvents as unknown as AbstractDomainEvent[]
            );

            const result = await factory.buildFromEventLog(faker.string.uuid());

            expect(domainEventDeserializer.deserializeDomainEvents).toHaveBeenCalledWith(...mockSerializedEvents);
            expect(aggregateDomainEventApplier.applyDomainEventToAggregate).toHaveBeenCalledTimes(2);
            expect(result).toBeDefined();
        });

        it("should return null if no events are found in event log", async () => {
            const factory = createFactory();
            mockDomainEventRepository.getAggregateDomainEvents.mockResolvedValue([]);
            const result = await factory.buildFromEventLog(faker.string.uuid());
            expect(result).toBeNull();
        });
    });

    describe("buildFromLatestSnapshot", () => {
        it("should build the aggregate from the latest snapshot", async () => {
            const factory = createFactory();

            const aggregateId = faker.string.uuid();

            const mockSerializedEvents = [
                { id: faker.string.uuid() },
                { id: faker.string.uuid() }
            ] as SerializedDomainEvent[];

            mockDomainEventRepository.getAggregateDomainEvents.mockResolvedValueOnce(mockSerializedEvents);

            vi.spyOn(domainEventDeserializer, "deserializeDomainEvents").mockReturnValue(
                mockSerializedEvents as unknown as AbstractDomainEvent[]
            );

            const latestSnapshot: SerializedSnapshot = {
                domainEventSequenceNumber: 1,
                origin: "CurrentOrigin",
                aggregateType: "TestType",
                aggregateId,
                snapshotData: {}
            };

            mockSnapshotRepository.getLatestSnapshot.mockResolvedValueOnce(latestSnapshot);

            const mockAggregateInstance = new (MockAggregate as any)().setId(aggregateId);

            vi.spyOn(aggregateSnapshotTransformer, "restoreFromSnapshot").mockImplementation((() => {
                return mockAggregateInstance;
            }) as any);

            const result = await factory.buildFromLatestSnapshot(aggregateId);

            expect(domainEventDeserializer.deserializeDomainEvents).toHaveBeenCalledWith(...mockSerializedEvents);
            expect(aggregateDomainEventApplier.applyDomainEventToAggregate).toHaveBeenCalledTimes(2);
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
