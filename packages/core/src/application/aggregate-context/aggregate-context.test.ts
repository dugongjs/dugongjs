import { mock } from "vitest-mock-extended";
import { AbstractAggregateRoot } from "../../domain/abstract-aggregate-root/abstract-aggregate-root.js";
import { AbstractEventSourcedAggregateRoot, Aggregate, ExternalAggregate, TenantScoped } from "../../domain/index.js";
import { ISnapshotRepository } from "../../ports/index.js";
import type { IDomainEventRepository } from "../../ports/outbound/repository/i-domain-event-repository.js";
import type { ITransactionManager } from "../../ports/outbound/transaction-manager/i-transaction-manager.js";
import { AggregateFactory } from "../aggregate-factory/aggregate-factory.js";
import { AggregateManager } from "../aggregate-manager/aggregate-manager.js";
import { AggregateContext, type AggregateContextOptions } from "./aggregate-context.js";
import { AggregateForbidsTenantScopeError } from "../tenant-scope/errors/aggregate-forbids-tenant-scope.error.js";
import { AggregateRequiresTenantScopeError } from "../tenant-scope/errors/aggregate-requires-tenant-scope.error.js";
import { AggregateManagerNotAvailableError } from "./errors/aggregate-manager-not-available-error.js";

@Aggregate("TestAggregate")
class TestAggregate extends AbstractAggregateRoot {}

@ExternalAggregate("TestEventSourcedAggregate", "TestExternalOrigin")
class TestEventSourcedAggregate extends AbstractEventSourcedAggregateRoot {}

@Aggregate("AlwaysScopedContextAggregate")
@TenantScoped.Always()
class AlwaysScopedContextAggregate extends AbstractAggregateRoot {}

@Aggregate("NeverScopedContextAggregate")
@TenantScoped.Never()
class NeverScopedContextAggregate extends AbstractAggregateRoot {}

describe("AggregateContext", () => {
    const mockTransactionManager = mock<ITransactionManager>({
        transaction: (fn) => fn({})
    });
    const mockDomainEventRepository = mock<IDomainEventRepository>();
    const mockSnapshotRepository = mock<ISnapshotRepository>();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    function createAggregateContext(overrides: Partial<AggregateContextOptions<any>> = {}) {
        return new AggregateContext({
            aggregateClass: TestAggregate,
            currentOrigin: "TestOrigin",
            transactionManager: mockTransactionManager,
            domainEventRepository: mockDomainEventRepository,
            ...overrides
        });
    }

    describe("constructor", () => {
        it("should create an instance of AggregateContext", () => {
            const aggregateContext = createAggregateContext();

            expect(aggregateContext).toBeInstanceOf(AggregateContext);
        });
    });

    describe("getFactory", () => {
        it("should return the factory for an AbstractAggregateRoot", () => {
            const aggregateContext = createAggregateContext();

            const factory = aggregateContext.getFactory();

            expect(factory).toBeInstanceOf(AggregateFactory);
        });

        it("should return the factory for an AbstractEventSourcedAggregateRoot", () => {
            const aggregateContext = createAggregateContext({
                aggregateClass: TestEventSourcedAggregate
            });

            const factory = aggregateContext.getFactory();

            expect(factory).toBeInstanceOf(AggregateFactory);
        });
    });

    describe("getManager", () => {
        it("should return the manager for an AbstractAggregateRoot", () => {
            const aggregateContext = createAggregateContext();

            const manager = aggregateContext.getManager();

            expect(manager).toBeInstanceOf(AggregateManager);
        });

        it("should throw an error if called for an AbstractEventSourcedAggregateRoot", () => {
            const aggregateContext = createAggregateContext({
                aggregateClass: TestEventSourcedAggregate
            });

            expect(() => aggregateContext.getManager()).toThrow(AggregateManagerNotAvailableError);
        });
    });

    describe("tenant scope tracking", () => {
        it("should leave the tenant scope unset when neither method is called", () => {
            const aggregateContext = createAggregateContext();

            expect(aggregateContext.getFactory()["tenantScope"]).toBeUndefined();
            expect(aggregateContext.getManager()["tenantScope"]).toBeUndefined();
        });

        it("should record a tenant scope when scoped to a tenant", () => {
            const newContext = createAggregateContext().withTenantId("TestTenant");

            expect(newContext.getFactory()["tenantScope"]).toEqual({ type: "tenant", tenantId: "TestTenant" });
            expect(newContext.getManager()["tenantScope"]).toEqual({ type: "tenant", tenantId: "TestTenant" });
        });

        it("should record an unscoped decision when explicitly unscoped", () => {
            const newContext = createAggregateContext().withoutTenantId();

            expect(newContext.getFactory()["tenantScope"]).toEqual({ type: "unscoped" });
            expect(newContext.getManager()["tenantScope"]).toEqual({ type: "unscoped" });
        });

        it("should distinguish an unset scope from an explicitly unscoped one", () => {
            const unset = createAggregateContext();
            const unscoped = unset.withoutTenantId();

            expect(unset.getFactory()["tenantScope"]).toBeUndefined();
            expect(unscoped.getFactory()["tenantScope"]).toEqual({ type: "unscoped" });
        });

        it("should resolve no tenant ID for both an unset and an explicitly unscoped context", () => {
            const unset = createAggregateContext();
            const unscoped = unset.withoutTenantId();

            expect(unset.getFactory()["tenantId"]).toBeUndefined();
            expect(unscoped.getFactory()["tenantId"]).toBeUndefined();
        });

        it("should allow a scoped context to be made explicitly unscoped", () => {
            const newContext = createAggregateContext().withTenantId("TestTenant").withoutTenantId();

            expect(newContext.getFactory()["tenantScope"]).toEqual({ type: "unscoped" });
            expect(newContext.getFactory()["tenantId"]).toBeUndefined();
        });
    });

    describe("tenancy declarations", () => {
        it("should reject withoutTenantId when the aggregate declares always", () => {
            const aggregateContext = createAggregateContext({ aggregateClass: AlwaysScopedContextAggregate });

            expect(() => aggregateContext.withoutTenantId()).toThrow(AggregateRequiresTenantScopeError);
        });

        it("should allow withTenantId when the aggregate declares always", () => {
            const aggregateContext = createAggregateContext({ aggregateClass: AlwaysScopedContextAggregate });

            expect(() => aggregateContext.withTenantId("TestTenant")).not.toThrow();
        });

        it("should reject withTenantId when the aggregate declares never", () => {
            const aggregateContext = createAggregateContext({ aggregateClass: NeverScopedContextAggregate });

            expect(() => aggregateContext.withTenantId("TestTenant")).toThrow(AggregateForbidsTenantScopeError);
        });

        it("should allow withoutTenantId when the aggregate declares never", () => {
            const aggregateContext = createAggregateContext({ aggregateClass: NeverScopedContextAggregate });

            expect(() => aggregateContext.withoutTenantId()).not.toThrow();
        });

        it("should name the aggregate and the attempted call in the error", () => {
            const aggregateContext = createAggregateContext({ aggregateClass: NeverScopedContextAggregate });

            expect(() => aggregateContext.withTenantId("TestTenant")).toThrow(/NeverScopedContextAggregate/);
            expect(() => aggregateContext.withTenantId("TestTenant")).toThrow(/withTenantId/);
        });
    });

    describe("withoutTenantId", () => {
        it("should return a new AggregateContext rather than mutating the current one", () => {
            const aggregateContext = createAggregateContext();

            const newContext = aggregateContext.withoutTenantId();

            expect(newContext).toBeInstanceOf(AggregateContext);
            expect(newContext).not.toBe(aggregateContext);
            expect(aggregateContext.getFactory()["tenantScope"]).toBeUndefined();
        });

        it("should preserve the transaction context set on the factory and manager", () => {
            const aggregateContext = createAggregateContext();

            const mockTransactionContext = { id: "test-transaction" };
            aggregateContext.getFactory().setTransactionContext(mockTransactionContext);
            aggregateContext.getManager().setTransactionContext(mockTransactionContext);

            const newContext = aggregateContext.withoutTenantId();

            expect(newContext.getFactory().getTransactionContext()).toBe(mockTransactionContext);
            expect(newContext.getManager().getTransactionContext()).toBe(mockTransactionContext);
        });

        it("should not throw for an AbstractEventSourcedAggregateRoot, which has no manager", () => {
            const aggregateContext = createAggregateContext({
                aggregateClass: TestEventSourcedAggregate,
                snapshotRepository: mockSnapshotRepository
            });

            expect(() => aggregateContext.withoutTenantId()).not.toThrow();
            expect(aggregateContext.withoutTenantId().getFactory()["tenantScope"]).toEqual({ type: "unscoped" });
        });
    });

    describe("withTenantId", () => {
        it("should return a new AggregateContext with the specified tenantId", () => {
            const aggregateContext = createAggregateContext();

            const tenantId = "TestTenant";
            const newContext = aggregateContext.withTenantId(tenantId);

            expect(newContext).toBeInstanceOf(AggregateContext);
            expect(newContext.getFactory()["tenantId"]).toBe(tenantId);
            expect(newContext.getManager()["tenantId"]).toBe(tenantId);
        });

        it("should preserve the transaction context set on the factory when creating a new context", () => {
            const aggregateContext = createAggregateContext();

            const mockTransactionContext = { id: "test-transaction" };
            aggregateContext.getFactory().setTransactionContext(mockTransactionContext);

            expect(aggregateContext.getFactory().getTransactionContext()).toBe(mockTransactionContext);

            const tenantId = "TestTenant";
            const newContext = aggregateContext.withTenantId(tenantId);

            expect(newContext.getFactory().getTransactionContext()).toBe(mockTransactionContext);
        });

        it("should preserve the transaction context set on the manager when creating a new context", () => {
            const aggregateContext = createAggregateContext();

            const mockTransactionContext = { id: "test-transaction" };
            aggregateContext.getFactory().setTransactionContext(mockTransactionContext);
            aggregateContext.getManager().setTransactionContext(mockTransactionContext);

            expect(aggregateContext.getFactory().getTransactionContext()).toBe(mockTransactionContext);
            expect(aggregateContext.getManager().getTransactionContext()).toBe(mockTransactionContext);

            const newContext = aggregateContext.withTenantId("TestTenant");

            expect(newContext.getFactory().getTransactionContext()).toBe(mockTransactionContext);
            expect(newContext.getManager().getTransactionContext()).toBe(mockTransactionContext);
        });

        it("should not throw for an AbstractEventSourcedAggregateRoot, which has no manager", () => {
            const aggregateContext = createAggregateContext({
                aggregateClass: TestEventSourcedAggregate,
                snapshotRepository: mockSnapshotRepository
            });

            const tenantId = "TestTenant";

            expect(() => aggregateContext.withTenantId(tenantId)).not.toThrow();
            expect(aggregateContext.withTenantId(tenantId).getFactory()["tenantId"]).toBe(tenantId);
        });

        it("should preserve the transaction context on the factory when there is no manager", () => {
            const aggregateContext = createAggregateContext({
                aggregateClass: TestEventSourcedAggregate,
                snapshotRepository: mockSnapshotRepository
            });

            const mockTransactionContext = { id: "test-transaction" };
            aggregateContext.getFactory().setTransactionContext(mockTransactionContext);

            const newContext = aggregateContext.withTenantId("TestTenant");

            expect(newContext.getFactory().getTransactionContext()).toBe(mockTransactionContext);
        });

        it("should surface errors from the manager that are not AggregateManagerNotAvailableError", () => {
            const aggregateContext = createAggregateContext();

            aggregateContext.getFactory().setTransactionContext({ id: "test-transaction" });

            const unexpectedError = new Error("setTransactionContext failed");
            vi.spyOn(AggregateManager.prototype, "setTransactionContext").mockImplementationOnce(() => {
                throw unexpectedError;
            });

            expect(() => aggregateContext.withTenantId("TestTenant")).toThrow(unexpectedError);
        });
    });

    describe("type-safety", () => {
        it("should return the correct type for the factory for AbstractAggregateRoot", () => {
            const aggregateContext = new AggregateContext({
                aggregateClass: TestAggregate,
                currentOrigin: "TestOrigin",
                transactionManager: mockTransactionManager,
                domainEventRepository: mockDomainEventRepository
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
            // eslint-disable-next-line @typescript-eslint/no-unused-vars -- used only in the ReturnType query below
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
