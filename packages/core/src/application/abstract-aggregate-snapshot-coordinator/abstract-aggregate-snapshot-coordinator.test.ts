import { faker } from "@faker-js/faker";
import { mock, mockReset } from "vitest-mock-extended";
import { AbstractAggregateRoot } from "../../domain/abstract-aggregate-root/abstract-aggregate-root.js";
import {
    aggregateMetadataRegistry,
    type AggregateMetadata
} from "../../domain/aggregate-metadata-registry/aggregate-metadata-registry.js";
import type { ISnapshotRepository } from "../../ports/outbound/repository/i-snapshot-repository.js";
import type { ITransactionManager } from "../../ports/outbound/transaction-manager/i-transaction-manager.js";
import { aggregateSnapshotTransformer } from "../aggregate-snapshot-transformer/aggregate-snapshot-transformer.js";
import type { ILogger } from "../logger/i-logger.js";
import { AbstractAggregateSnapshotCoordinator } from "./abstract-aggregate-snapshot-coordinator.js";

describe("AbstractAggregateSnapshotCoordinator", () => {
    class MockAggregate extends AbstractAggregateRoot {}
    class MockAggregateSnapshotCoordinator extends AbstractAggregateSnapshotCoordinator<typeof MockAggregate> {
        // Make it public for testing
        public async snapshotIfNecessary(aggregate: InstanceType<typeof MockAggregate>): Promise<void> {
            return super.snapshotIfNecessary(aggregate);
        }
    }

    const mockTransactionManager = mock<ITransactionManager>({
        transaction: (fn) => fn({})
    });

    const mockSnapshotRepository = mock<ISnapshotRepository>();
    const mockLogger = mock<ILogger>();

    const aggregateMetadata: AggregateMetadata = {
        isInternal: false,
        origin: "TestOrigin",
        type: "TestType"
    };

    beforeEach(() => {
        aggregateMetadataRegistry.getAggregateMetadata = vi.fn(() => aggregateMetadata);
        aggregateMetadataRegistry.getAggregateSnapshotMetadata = vi.fn(() => ({
            isSnapshotable: true,
            snapshotInterval: 10
        }));

        aggregateSnapshotTransformer.takeSnapshot = vi.fn();
        aggregateSnapshotTransformer.canBeRestoredFromSnapshot = vi.fn(() => ({
            isEqual: true,
            snapshot: {},
            restored: {}
        }));
    });

    afterEach(() => {
        mockReset(mockTransactionManager);
        mockReset(mockSnapshotRepository);
        mockReset(mockLogger);
        vi.clearAllMocks();
    });

    function createCoordinator(overrides: Partial<any> = {}) {
        return new MockAggregateSnapshotCoordinator({
            aggregateClass: MockAggregate,
            transactionManager: mockTransactionManager,
            snapshotRepository: mockSnapshotRepository,
            currentOrigin: "CurrentOrigin",
            logger: mockLogger,
            ...overrides
        });
    }

    function createCoordinatorWithSnapshotMetadata(
        snapshotMetadata: {
            isSnapshotable: boolean;
            snapshotInterval: number;
        } | null
    ) {
        aggregateMetadataRegistry.getAggregateSnapshotMetadata = vi.fn(() => snapshotMetadata);

        return createCoordinator();
    }

    describe("snapshotIfNecessary", () => {
        it("does nothing if aggregate is not snapshotable", async () => {
            const coordinator = createCoordinatorWithSnapshotMetadata(null);
            const aggregate = new MockAggregate();

            aggregate.setCurrentDomainEventSequenceNumber(10);

            await coordinator.snapshotIfNecessary(aggregate);

            expect(aggregateSnapshotTransformer.takeSnapshot).not.toHaveBeenCalled();
            expect(mockSnapshotRepository.saveSnapshot).not.toHaveBeenCalled();
        });

        it("does nothing if snapshot interval is not reached", async () => {
            const coordinator = createCoordinator();
            const aggregate = new MockAggregate();

            aggregate.setCurrentDomainEventSequenceNumber(5);

            await coordinator.snapshotIfNecessary(aggregate);

            expect(aggregateSnapshotTransformer.takeSnapshot).not.toHaveBeenCalled();
            expect(mockSnapshotRepository.saveSnapshot).not.toHaveBeenCalled();
        });

        it("creates a snapshot when interval is reached and no snapshot exists", async () => {
            const coordinator = createCoordinator();
            const aggregate = new MockAggregate();

            aggregate.setCurrentDomainEventSequenceNumber(10);

            mockSnapshotRepository.getLatestSnapshot.mockResolvedValue(null);

            await coordinator.snapshotIfNecessary(aggregate);

            expect(aggregateSnapshotTransformer.takeSnapshot).toHaveBeenCalledWith(
                "TestOrigin",
                "TestType",
                aggregate,
                undefined
            );

            expect(mockSnapshotRepository.saveSnapshot).toHaveBeenCalled();
        });

        it("creates a snapshot when enough events occurred since last snapshot", async () => {
            const coordinator = createCoordinator();
            const aggregate = new MockAggregate();

            aggregate.setCurrentDomainEventSequenceNumber(25);

            mockSnapshotRepository.getLatestSnapshot.mockResolvedValue({
                domainEventSequenceNumber: 10
            } as any);

            await coordinator.snapshotIfNecessary(aggregate);

            expect(aggregateSnapshotTransformer.takeSnapshot).toHaveBeenCalled();
            expect(mockSnapshotRepository.saveSnapshot).toHaveBeenCalled();
        });

        it("does not create a snapshot if latest snapshot is ahead or equal", async () => {
            const coordinator = createCoordinator();
            const aggregate = new MockAggregate();

            aggregate.setCurrentDomainEventSequenceNumber(10);

            mockSnapshotRepository.getLatestSnapshot.mockResolvedValue({
                domainEventSequenceNumber: 10
            } as any);

            await coordinator.snapshotIfNecessary(aggregate);

            expect(aggregateSnapshotTransformer.takeSnapshot).not.toHaveBeenCalled();
            expect(mockSnapshotRepository.saveSnapshot).not.toHaveBeenCalled();
        });

        it("does not create a snapshot if aggregate cannot be restored from snapshot", async () => {
            (aggregateSnapshotTransformer.canBeRestoredFromSnapshot as any) = vi.fn(() => ({
                isEqual: false,
                snapshot: {},
                restored: {}
            }));

            const coordinator = createCoordinator();
            const aggregate = new MockAggregate();

            aggregate.setCurrentDomainEventSequenceNumber(10);

            await coordinator.snapshotIfNecessary(aggregate);

            expect(aggregateSnapshotTransformer.takeSnapshot).not.toHaveBeenCalled();
            expect(mockSnapshotRepository.saveSnapshot).not.toHaveBeenCalled();
        });

        it("passes tenantId to snapshot transformer when provided", async () => {
            const tenantId = faker.string.uuid();

            const coordinator = createCoordinator({ tenantId });
            const aggregate = new MockAggregate();

            aggregate.setCurrentDomainEventSequenceNumber(10);

            await coordinator.snapshotIfNecessary(aggregate);

            expect(aggregateSnapshotTransformer.takeSnapshot).toHaveBeenCalledWith(
                "TestOrigin",
                "TestType",
                aggregate,
                tenantId
            );
        });
    });
});
