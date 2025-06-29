import { mock } from "vitest-mock-extended";
import { AbstractAggregateRoot } from "../../domain/abstract-aggregate-root/abstract-aggregate-root.js";
import { AbstractEventSourcedAggregateRoot, Aggregate, ExternalAggregate } from "../../domain/index.js";
import type { IDomainEventRepository } from "../../ports/outbound/repository/i-domain-event-repository.js";
import type { ISnapshotRepository } from "../../ports/outbound/repository/i-snapshot-repository.js";
import type { ITransactionManager } from "../../ports/outbound/transaction-manager/i-transaction-manager.js";
import { AggregateFactory } from "../aggregate-factory/aggregate-factory.js";
import { AggregateManager } from "../aggregate-manager/aggregate-manager.js";
import { AggregateContext } from "./aggregate-context.js";
import { AggregateManagerNotAvailableError } from "./errors/aggregate-manager-not-available-error.js";

@Aggregate("TestAggregate")
class TestAggregate extends AbstractAggregateRoot {}

@ExternalAggregate("TestEventSourcedAggregate", "TestExternalOrigin")
class TestEventSourcedAggregate extends AbstractEventSourcedAggregateRoot {}

describe("AggregateContext", () => {
    const mockTransactionManager = mock<ITransactionManager>({
        transaction: (fn) => fn({})
    });
    const mockDomainEventRepository = mock<IDomainEventRepository>();
    const mockSnapshotRepository = mock<ISnapshotRepository>();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("constructor", () => {
        it("should create an instance of AggregateContext", () => {
            const aggregateContext = new AggregateContext({
                aggregateClass: TestAggregate,
                currentOrigin: "TestOrigin",
                transactionManager: mockTransactionManager,
                domainEventRepository: mockDomainEventRepository,
                snapshotRepository: mockSnapshotRepository
            });

            expect(aggregateContext).toBeInstanceOf(AggregateContext);
        });
    });

    describe("getFactory", () => {
        it("should return the factory for an AbstractAggregateRoot", () => {
            const aggregateContext = new AggregateContext({
                aggregateClass: TestAggregate,
                currentOrigin: "TestOrigin",
                transactionManager: mockTransactionManager,
                domainEventRepository: mockDomainEventRepository,
                snapshotRepository: mockSnapshotRepository
            });

            const factory = aggregateContext.getFactory();

            expect(factory).toBeInstanceOf(AggregateFactory);
        });

        it("should return the factory for an AbstractEventSourcedAggregateRoot", () => {
            const aggregateContext = new AggregateContext({
                aggregateClass: TestEventSourcedAggregate,
                currentOrigin: "TestOrigin",
                transactionManager: mockTransactionManager,
                domainEventRepository: mockDomainEventRepository,
                snapshotRepository: mockSnapshotRepository
            });

            const factory = aggregateContext.getFactory();

            expect(factory).toBeInstanceOf(AggregateFactory);
        });
    });

    describe("getManager", () => {
        it("should return the manager for an AbstractAggregateRoot", () => {
            const aggregateContext = new AggregateContext({
                aggregateClass: TestAggregate,
                currentOrigin: "TestOrigin",
                transactionManager: mockTransactionManager,
                domainEventRepository: mockDomainEventRepository,
                snapshotRepository: mockSnapshotRepository
            });

            const manager = aggregateContext.getManager();

            expect(manager).toBeInstanceOf(AggregateManager);
        });

        it("should throw an error if called for an AbstractEventSourcedAggregateRoot", () => {
            const aggregateContext = new AggregateContext({
                aggregateClass: TestEventSourcedAggregate,
                currentOrigin: "TestOrigin",
                transactionManager: mockTransactionManager,
                domainEventRepository: mockDomainEventRepository,
                snapshotRepository: mockSnapshotRepository
            });

            expect(() => aggregateContext.getManager()).toThrow(AggregateManagerNotAvailableError);
        });
    });

    describe("withTenantId", () => {
        it("should return a new AggregateContext with the specified tenantId", () => {
            const aggregateContext = new AggregateContext({
                aggregateClass: TestAggregate,
                currentOrigin: "TestOrigin",
                transactionManager: mockTransactionManager,
                domainEventRepository: mockDomainEventRepository,
                snapshotRepository: mockSnapshotRepository
            });

            const tenantId = "TestTenant";
            const newContext = aggregateContext.withTenantId(tenantId);

            expect(newContext).toBeInstanceOf(AggregateContext);
            expect(newContext.getFactory()["tenantId"]).toBe(tenantId);
            expect(newContext.getManager()["tenantId"]).toBe(tenantId);
        });
    });

    describe("type-safety", () => {
        it("should return the correct type for the factory for AbstractAggregateRoot", () => {
            const aggregateContext = new AggregateContext({
                aggregateClass: TestAggregate,
                currentOrigin: "TestOrigin",
                transactionManager: mockTransactionManager,
                domainEventRepository: mockDomainEventRepository,
                snapshotRepository: mockSnapshotRepository
            });

            const factory = aggregateContext.getFactory();

            expectTypeOf(factory).toEqualTypeOf<AggregateFactory<typeof TestAggregate>>();
        });

        it("should return the correct type for the factory for AbstractEventSourcedAggregateRoot", () => {
            const aggregateContext = new AggregateContext({
                aggregateClass: TestEventSourcedAggregate,
                currentOrigin: "TestOrigin",
                transactionManager: mockTransactionManager,
                domainEventRepository: mockDomainEventRepository,
                snapshotRepository: mockSnapshotRepository
            });

            const factory = aggregateContext.getFactory();

            expectTypeOf(factory).toEqualTypeOf<AggregateFactory<typeof TestEventSourcedAggregate>>();
        });

        it("should return the correct type for the manager for AbstractAggregateRoot", () => {
            const aggregateContext = new AggregateContext({
                aggregateClass: TestAggregate,
                currentOrigin: "TestOrigin",
                transactionManager: mockTransactionManager,
                domainEventRepository: mockDomainEventRepository,
                snapshotRepository: mockSnapshotRepository
            });

            const manager = aggregateContext.getManager();

            expectTypeOf(manager).toEqualTypeOf<AggregateManager<typeof TestAggregate>>();
        });

        it("should return never for the manager for AbstractEventSourcedAggregateRoot", () => {
            const aggregateContext = new AggregateContext({
                aggregateClass: TestEventSourcedAggregate,
                currentOrigin: "TestOrigin",
                transactionManager: mockTransactionManager,
                domainEventRepository: mockDomainEventRepository,
                snapshotRepository: mockSnapshotRepository
            });

            type Manager = ReturnType<typeof aggregateContext.getManager>;

            expectTypeOf<Manager>().toEqualTypeOf<never>();
        });
    });
});
