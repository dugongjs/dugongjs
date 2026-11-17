import {
    DugongAdapterBuilder,
    DugongModule,
    EventSourcingModule,
    EventSourcingService,
    repositoryInMemoryAdapter,
    transactionManagerInMemoryAdapter
} from "@dugongjs/nestjs";
import { faker } from "@faker-js/faker";
import { Injectable, Module, type CanActivate, type ExecutionContext, type INestMicroservice } from "@nestjs/common";
import { APP_GUARD, NestFactory } from "@nestjs/core";
import { ClientProxyFactory, Transport, type MicroserviceOptions } from "@nestjs/microservices";
import { AggregateQueryClientProxyService } from "../../../src/client/aggregate-query-client-proxy.service.js";
import { AggregateQueryMicroserviceModule } from "../../../src/server/aggregate-query-microservice.module.js";
import { User } from "../fixtures/user/domain/user.js";

const GUARDED_PORT = +process.env.TCP_PORT! + 100;
const VALID_TOKEN = "valid-token";
const PERMITTED_TENANT = "permitted-tenant";

@Injectable()
class QueryAuthGuard implements CanActivate {
    public canActivate(context: ExecutionContext): boolean {
        const request = context.switchToRpc().getData();

        if (request?.credentials !== VALID_TOKEN) {
            return false;
        }

        request.tenantScope = { type: "tenant", tenantId: PERMITTED_TENANT };

        return true;
    }
}

@Module({
    imports: [
        DugongModule.forRoot({
            currentOrigin: "IAM-UserService",
            adapters: new DugongAdapterBuilder()
                .registerMany(transactionManagerInMemoryAdapter, repositoryInMemoryAdapter)
                .build()
        }),
        AggregateQueryMicroserviceModule,
        EventSourcingModule
    ],
    providers: [{ provide: APP_GUARD, useClass: QueryAuthGuard }]
})
class GuardedQueryModule {}

function createClient(credentials?: string): AggregateQueryClientProxyService {
    const proxy = ClientProxyFactory.create({
        transport: Transport.TCP,
        options: { host: "localhost", port: GUARDED_PORT }
    });

    const credentialed = {
        send: (pattern: any, data: any) => proxy.send(pattern, { ...data, credentials }),
        connect: () => proxy.connect(),
        close: () => proxy.close()
    } as any;

    return new AggregateQueryClientProxyService(credentialed);
}

describe("query guard behavior", () => {
    let guardedService: INestMicroservice;
    let eventSourcingService: EventSourcingService;

    beforeAll(async () => {
        guardedService = await NestFactory.createMicroservice<MicroserviceOptions>(GuardedQueryModule, {
            transport: Transport.TCP,
            options: { host: "localhost", port: GUARDED_PORT },
            logger: false,
            abortOnError: false
        });

        await guardedService.listen();
    }, 60000);

    afterAll(async () => {
        await guardedService?.close();
    });

    beforeEach(() => {
        eventSourcingService = guardedService.get(EventSourcingService);
    });

    async function createUserInTenant(tenantId: string): Promise<User> {
        const userContext = eventSourcingService.createAggregateContext(null, User).withTenantId(tenantId);
        const user = new User();

        user.createUser({ email: faker.internet.email(), username: faker.internet.username() });

        await userContext.applyAndCommitStagedDomainEvents(user);

        return user;
    }

    describe("when the caller presents no credentials", () => {
        it("should reject the query", async () => {
            const client = createClient();

            await expect(client.getAggregateTypes()).rejects.toThrow();

            await client.close();
        });

        it("should reject the query before reading any aggregate", async () => {
            const user = await createUserInTenant(PERMITTED_TENANT);
            const client = createClient();

            await expect(client.getAggregate("IAM-UserService", "User", user.getId())).rejects.toThrow();

            await client.close();
        });
    });

    describe("when the caller presents valid credentials", () => {
        it("should allow the query", async () => {
            const client = createClient(VALID_TOKEN);

            await expect(client.getAggregateTypes()).resolves.toEqual(["User"]);

            await client.close();
        });

        it("should read the aggregate in the tenant the guard permits", async () => {
            const user = await createUserInTenant(PERMITTED_TENANT);
            const client = createClient(VALID_TOKEN);

            const aggregate: any = await client.getAggregate("IAM-UserService", "User", user.getId());

            expect(aggregate).toMatchObject({ id: user.getId() });

            await client.close();
        });

        it("should ignore a tenant the caller asserts and use the one the guard permits", async () => {
            const user = await createUserInTenant(PERMITTED_TENANT);
            const client = createClient(VALID_TOKEN);

            const aggregate: any = await client.getAggregate("IAM-UserService", "User", user.getId(), {
                tenantScope: { type: "tenant", tenantId: "some-other-tenant" }
            });

            expect(aggregate).toMatchObject({ id: user.getId() });

            await client.close();
        });

        it("should not read an aggregate belonging to a tenant the guard does not permit", async () => {
            const user = await createUserInTenant("unpermitted-tenant");
            const client = createClient(VALID_TOKEN);

            const aggregate = await client.getAggregate("IAM-UserService", "User", user.getId());

            expect(aggregate).toBeNull();

            await client.close();
        });
    });
});
