import { IMessageProducer, type TenantScope } from "@dugongjs/core";
import { EventSourcingService } from "@dugongjs/nestjs";
import { faker } from "@faker-js/faker";
import { Inject, Injectable, Module } from "@nestjs/common";
import { ClientProxyFactory, Transport } from "@nestjs/microservices";
import { Test, type TestingModule } from "@nestjs/testing";
import { AggregateQueryClientProxyService } from "../../../src/client/aggregate-query-client-proxy.service.js";
import { User } from "../fixtures/user/domain/user.js";
import { app } from "../setup/setup/app.js";

const QUERY_CLIENT = "QUERY_CLIENT";

@Injectable()
class UserReplicaService {
    constructor(@Inject(QUERY_CLIENT) private readonly queryClient: AggregateQueryClientProxyService) {}

    public async readUser(userId: string, tenantScope: TenantScope = { type: "unscoped" }): Promise<any> {
        return this.queryClient.getAggregate("IAM-UserService", "User", userId, { tenantScope });
    }

    public async listUserIds(tenantScope: TenantScope = { type: "unscoped" }): Promise<string[]> {
        return this.queryClient.getAggregateIds("IAM-UserService", "User", { tenantScope });
    }

    public async readUserEvents(userId: string, tenantScope: TenantScope): Promise<any[]> {
        return this.queryClient.getDomainEventsForAggregate("IAM-UserService", "User", userId, { tenantScope });
    }

    public async listAggregateTypes(): Promise<string[]> {
        return this.queryClient.getAggregateTypes();
    }
}

@Module({
    providers: [
        UserReplicaService,
        {
            provide: QUERY_CLIENT,
            useFactory: () =>
                new AggregateQueryClientProxyService(
                    ClientProxyFactory.create({
                        transport: Transport.TCP,
                        options: { host: "localhost", port: +process.env.TCP_PORT! }
                    })
                )
        }
    ]
})
class ConsumingServiceModule {}

describe("two service query behavior", () => {
    let consumingService: TestingModule;
    let userReplicaService: UserReplicaService;
    let eventSourcingService: EventSourcingService;

    beforeAll(async () => {
        consumingService = await Test.createTestingModule({ imports: [ConsumingServiceModule] }).compile();

        await consumingService.init();

        userReplicaService = consumingService.get(UserReplicaService);
    });

    afterAll(async () => {
        await consumingService?.close();
    });

    beforeEach(() => {
        eventSourcingService = app.get(EventSourcingService);
    });

    async function createUserInOwningService(tenantId?: string): Promise<User> {
        const baseContext = eventSourcingService.createAggregateContext(null, User);
        const userContext = tenantId ? baseContext.withTenantId(tenantId) : baseContext.withoutTenantId();
        const user = new User();

        user.createUser({ email: faker.internet.email(), username: faker.internet.username() });

        await userContext.applyAndCommitStagedDomainEvents(user);

        return user;
    }

    describe("when a consuming service queries the owning service", () => {
        it("should read the aggregate types the owning service exposes", async () => {
            const aggregateTypes = await userReplicaService.listAggregateTypes();

            expect(aggregateTypes).toEqual(["User"]);
        });

        it("should read an aggregate the owning service committed", async () => {
            const user = await createUserInOwningService();

            const replica = await userReplicaService.readUser(user.getId());

            expect(replica).toMatchObject({ id: user.getId(), email: user.getEmail() });
        });

        it("should read the aggregate ids the owning service holds", async () => {
            const user = await createUserInOwningService();

            const userIds = await userReplicaService.listUserIds();

            expect(userIds).toContain(user.getId());
        });

        it("should return null for an aggregate the owning service does not hold", async () => {
            const replica = await userReplicaService.readUser(faker.string.uuid());

            expect(replica).toBeNull();
        });
    });

    describe("when the consuming service queries within a tenant", () => {
        it("should read an aggregate belonging to the requested tenant", async () => {
            const user = await createUserInOwningService("tenant-a");

            const replica = await userReplicaService.readUser(user.getId(), {
                type: "tenant",
                tenantId: "tenant-a"
            });

            expect(replica).toMatchObject({ id: user.getId(), email: user.getEmail() });
        });

        it("should not read an aggregate belonging to a different tenant", async () => {
            const user = await createUserInOwningService("tenant-a");

            const replica = await userReplicaService.readUser(user.getId(), {
                type: "tenant",
                tenantId: "tenant-b"
            });

            expect(replica).toBeNull();
        });

        it("should not read a tenant's aggregate through an unscoped query", async () => {
            const user = await createUserInOwningService("tenant-a");

            const replica = await userReplicaService.readUser(user.getId(), { type: "unscoped" });

            expect(replica).toBeNull();
        });

        it("should list only the aggregate ids belonging to the requested tenant", async () => {
            const tenantAUser = await createUserInOwningService("tenant-a");
            const tenantBUser = await createUserInOwningService("tenant-b");

            const tenantAIds = await userReplicaService.listUserIds({ type: "tenant", tenantId: "tenant-a" });

            expect(tenantAIds).toContain(tenantAUser.getId());
            expect(tenantAIds).not.toContain(tenantBUser.getId());
        });

        it("should read the domain events belonging to the requested tenant", async () => {
            const user = await createUserInOwningService("tenant-a");

            const events = await userReplicaService.readUserEvents(user.getId(), {
                type: "tenant",
                tenantId: "tenant-a"
            });

            expect(events).toHaveLength(1);
            expect(events[0]).toMatchObject({ aggregateId: user.getId(), tenantId: "tenant-a" });
        });

        it("should not read another tenant's domain events", async () => {
            const user = await createUserInOwningService("tenant-a");

            const events = await userReplicaService.readUserEvents(user.getId(), {
                type: "tenant",
                tenantId: "tenant-b"
            });

            expect(events).toEqual([]);
        });
    });

    describe("when verifying the transport", () => {
        it("should fail when no service listens on the configured TCP port", async () => {
            const unreachableClient = new AggregateQueryClientProxyService(
                ClientProxyFactory.create({
                    transport: Transport.TCP,
                    options: { host: "localhost", port: +process.env.TCP_PORT! + 1 }
                })
            );

            await expect(unreachableClient.getAggregateTypes()).rejects.toThrow();

            await unreachableClient.close();
        });

        it("should carry the query over TCP rather than a message broker", () => {
            expect(() => app.get(IMessageProducer, { strict: false })).toThrow(/IMessageProducer/);
        });
    });
});
