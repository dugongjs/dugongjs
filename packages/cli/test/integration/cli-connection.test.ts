import { AbstractAggregateRoot, Aggregate, Apply, Process, TenantScoped } from "@dugongjs/core";
import { AbstractDomainEvent, DomainEvent } from "@dugongjs/core";
import {
    DugongAdapterBuilder,
    DugongModule,
    EventSourcingModule,
    EventSourcingService,
    repositoryInMemoryAdapter,
    transactionManagerInMemoryAdapter
} from "@dugongjs/nestjs";
import { AggregateQueryMicroserviceModule } from "@dugongjs/nestjs-microservice-query";
import type { INestMicroservice } from "@nestjs/common";
import { Module } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { Transport, type MicroserviceOptions } from "@nestjs/microservices";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const SERVICE_PORT = 8891;
const ORIGIN = "IAM-UserService";

@DomainEvent()
class CliUserCreatedEvent extends AbstractDomainEvent<{ email: string }> {
    public readonly origin = ORIGIN;
    public readonly aggregateType = "CliUser";
    public readonly type = "CliUserCreated";
    public readonly version = 1;
}

@DomainEvent()
class CliTenantedUserCreatedEvent extends AbstractDomainEvent<{ email: string }> {
    public readonly origin = ORIGIN;
    public readonly aggregateType = "CliTenantedUser";
    public readonly type = "CliTenantedUserCreated";
    public readonly version = 1;
}

@Aggregate("CliTenantedUser")
@TenantScoped.Always()
class CliTenantedUser extends AbstractAggregateRoot {
    public email: string;

    @Process({ isCreation: true })
    public createUser(email: string): void {
        this.stageDomainEvent(this.createDomainEvent(CliTenantedUserCreatedEvent, { email }));
    }

    @Apply(CliTenantedUserCreatedEvent)
    public applyCreated(event: CliTenantedUserCreatedEvent): void {
        this.email = event.getPayload()!.email;
    }
}

@Aggregate("CliUser")
@TenantScoped.Never()
class CliUser extends AbstractAggregateRoot {
    public email: string;

    @Process({ isCreation: true })
    public createUser(email: string): void {
        this.stageDomainEvent(this.createDomainEvent(CliUserCreatedEvent, { email }));
    }

    @Apply(CliUserCreatedEvent)
    public applyCreated(event: CliUserCreatedEvent): void {
        this.email = event.getPayload()!.email;
    }
}

@Module({
    imports: [
        DugongModule.forRoot({
            currentOrigin: ORIGIN,
            adapters: new DugongAdapterBuilder()
                .registerMany(transactionManagerInMemoryAdapter, repositoryInMemoryAdapter)
                .build()
        }),
        AggregateQueryMicroserviceModule,
        EventSourcingModule
    ]
})
class CliTargetServiceModule {}

describe("CLI connection", () => {
    let service: INestMicroservice;
    let configDir: string;
    let getAggregateQueryAdapter: (typeof import("../../src/adapters/resolver.js"))["getAggregateQueryAdapter"];
    let createdUserId: string;
    let tenantedUserId: string;

    beforeAll(async () => {
        configDir = mkdtempSync(join(tmpdir(), "dugong-cli-test-"));
        process.env.DUGONG_CONFIG_DIR = configDir;

        service = await NestFactory.createMicroservice<MicroserviceOptions>(CliTargetServiceModule, {
            transport: Transport.TCP,
            options: { host: "localhost", port: SERVICE_PORT },
            logger: false,
            abortOnError: false
        });

        await service.listen();

        const eventSourcingService = service.get(EventSourcingService);
        const userContext = eventSourcingService.createAggregateContext(null, CliUser);
        const user = new CliUser();

        user.createUser("cli@example.com");

        await userContext.applyAndCommitStagedDomainEvents(user);

        createdUserId = user.getId();

        const tenantedContext = eventSourcingService
            .createAggregateContext(null, CliTenantedUser)
            .withTenantId("tenant-a");
        const tenantedUser = new CliTenantedUser();

        tenantedUser.createUser("tenant-a@example.com");

        await tenantedContext.applyAndCommitStagedDomainEvents(tenantedUser);

        tenantedUserId = tenantedUser.getId();

        const { setConfig } = await import("../../src/config/context.js");

        setConfig(
            "test",
            { name: "test", host: "localhost", port: SERVICE_PORT, adapter: "nestjs-microservices", transport: "tcp" },
            true
        );

        ({ getAggregateQueryAdapter } = await import("../../src/adapters/resolver.js"));
    }, 60000);

    afterAll(async () => {
        await service?.close();
        rmSync(configDir, { recursive: true, force: true });
        delete process.env.DUGONG_CONFIG_DIR;
    });

    describe("when resolving the adapter from the current context", () => {
        it("should connect to the service and list its aggregate types", async () => {
            const { adapter, close } = getAggregateQueryAdapter();

            await expect(adapter.getAggregateTypes()).resolves.toContain("CliUser");

            await close?.();
        });

        it("should read an aggregate the service holds", async () => {
            const { adapter, close } = getAggregateQueryAdapter();

            const aggregate: any = await adapter.getAggregate(ORIGIN, "CliUser", createdUserId, {
                tenantScope: { type: "unscoped" }
            });

            expect(aggregate).toMatchObject({ id: createdUserId, email: "cli@example.com" });

            await close?.();
        });

        it("should read the domain events the service holds for an aggregate", async () => {
            const { adapter, close } = getAggregateQueryAdapter();

            const events = await adapter.getDomainEventsForAggregate(ORIGIN, "CliUser", createdUserId, {
                tenantScope: { type: "unscoped" }
            });

            expect(events).toHaveLength(1);
            expect(events[0]).toMatchObject({ type: "CliUserCreated", aggregateId: createdUserId });

            await close?.();
        });
    });

    describe("when querying within a tenant", () => {
        it("should read an aggregate belonging to the requested tenant", async () => {
            const { adapter, close } = getAggregateQueryAdapter();

            const aggregate: any = await adapter.getAggregate(ORIGIN, "CliTenantedUser", tenantedUserId, {
                tenantScope: { type: "tenant", tenantId: "tenant-a" }
            });

            expect(aggregate).toMatchObject({ id: tenantedUserId, email: "tenant-a@example.com" });

            await close?.();
        });

        it("should not read an aggregate belonging to a different tenant", async () => {
            const { adapter, close } = getAggregateQueryAdapter();

            const aggregate = await adapter.getAggregate(ORIGIN, "CliTenantedUser", tenantedUserId, {
                tenantScope: { type: "tenant", tenantId: "tenant-b" }
            });

            expect(aggregate).toBeNull();

            await close?.();
        });

        it("should reject an unscoped query for an aggregate that is always tenant scoped", async () => {
            const { adapter, close } = getAggregateQueryAdapter();

            await expect(
                adapter.getAggregate(ORIGIN, "CliTenantedUser", tenantedUserId, {
                    tenantScope: { type: "unscoped" }
                })
            ).rejects.toThrow();

            await close?.();
        });

        it("should list only the aggregate ids belonging to the requested tenant", async () => {
            const { adapter, close } = getAggregateQueryAdapter();

            const ids = await adapter.getAggregateIds(ORIGIN, "CliTenantedUser", {
                tenantScope: { type: "tenant", tenantId: "tenant-a" }
            });

            expect(ids).toEqual([tenantedUserId]);

            await close?.();
        });
    });

    describe("when no context is configured", () => {
        it("should fail with a message pointing at the config command", async () => {
            const { deleteContext, setConfig } = await import("../../src/config/context.js");

            deleteContext("test");

            expect(() => getAggregateQueryAdapter()).toThrow(/use-context/);

            setConfig(
                "test",
                {
                    name: "test",
                    host: "localhost",
                    port: SERVICE_PORT,
                    adapter: "nestjs-microservices",
                    transport: "tcp"
                },
                true
            );
        });
    });
});
