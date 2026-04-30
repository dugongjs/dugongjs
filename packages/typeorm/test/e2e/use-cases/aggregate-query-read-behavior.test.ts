import type { ITransactionManager } from "@dugongjs/core";
import { faker } from "@faker-js/faker";
import { mock } from "vitest-mock-extended";
import { AggregateManagerTypeOrm } from "../setup/app/aggregate-manager-typeorm.js";
import { AggregateQueryServiceTypeOrm } from "../setup/app/aggregate-query-service-typeorm.js";
import { User } from "./user-aggregate/user.js";

describe("aggregate query read behavior", () => {
    let userManager: AggregateManagerTypeOrm<typeof User>;
    let service: AggregateQueryServiceTypeOrm;

    beforeEach(() => {
        userManager = new AggregateManagerTypeOrm({
            aggregateClass: User,
            transactionManager: mock<ITransactionManager>(),
            currentOrigin: "IAM-UserService"
        });

        service = new AggregateQueryServiceTypeOrm({
            currentOrigin: "IAM-UserService"
        });
    });

    describe("when listing aggregate types", () => {
        it("returns registered aggregate types", async () => {
            const aggregateTypes = await service.getAggregateTypes();

            expect(aggregateTypes).toEqual(["User"]);
        });
    });

    describe("when listing aggregate ids", () => {
        it("returns aggregate ids for persisted aggregates", async () => {
            for await (const i of Array.from({ length: 10 })) {
                const user = new User();

                user.createUser({ email: faker.internet.email(), username: faker.internet.userName() });
                user.updateEmail({ email: faker.internet.email() });
                user.updateUsername({ username: faker.internet.userName() });

                await userManager.commitStagedDomainEvents(user);
            }

            const aggregateIds = await service.getAggregateIds("IAM-UserService", "User");

            expect(aggregateIds).toHaveLength(10);
        });

        it("includes ids for deleted aggregates", async () => {
            for await (const i of Array.from({ length: 10 })) {
                const user = new User();

                user.createUser({ email: faker.internet.email(), username: faker.internet.userName() });
                user.updateEmail({ email: faker.internet.email() });
                user.updateUsername({ username: faker.internet.userName() });
                user.deleteUser();

                await userManager.commitStagedDomainEvents(user);
            }

            const aggregateIds = await service.getAggregateIds("IAM-UserService", "User");

            expect(aggregateIds).toHaveLength(10);
        });
    });

    describe("when rebuilding an aggregate", () => {
        it("returns the latest aggregate state", async () => {
            const finalUsername = faker.internet.userName();
            const finalEmail = faker.internet.email();

            const user = new User();

            user.createUser({ email: faker.internet.email(), username: faker.internet.userName() });
            user.updateUsername({ username: finalUsername });
            user.updateEmail({ email: finalEmail });

            await userManager.commitStagedDomainEvents(user);

            const aggregate: any = await service.getAggregate(null, "User", user.getId());

            expect(aggregate.username).toEqual(finalUsername);
            expect(aggregate.email).toEqual(finalEmail);
        });

        it("supports rebuilding up to a specific sequence number", async () => {
            const initialUsername = faker.internet.userName();
            const initialEmail = faker.internet.email();

            const user = new User();

            user.createUser({ email: initialEmail, username: initialUsername });
            user.updateUsername({ username: faker.internet.userName() });
            user.updateEmail({ email: faker.internet.email() });

            await userManager.commitStagedDomainEvents(user);

            const aggregate: any = await service.getAggregate(null, "User", user.getId(), null, 1);

            expect(aggregate.username).toEqual(initialUsername);
            expect(aggregate.email).toEqual(initialEmail);
        });

        it("returns null when aggregate is not found", async () => {
            const aggregate = await service.getAggregate("IAM-UserService", "User", faker.string.uuid());

            expect(aggregate).toBeNull();
        });
    });

    describe("when reading domain events for an aggregate", () => {
        it("returns all events for the aggregate", async () => {
            const user = new User();

            user.createUser({ email: faker.internet.email(), username: faker.internet.userName() });
            user.updateEmail({ email: faker.internet.email() });
            user.updateUsername({ username: faker.internet.userName() });

            await userManager.commitStagedDomainEvents(user);

            const events = await service.getDomainEventsForAggregate("IAM-UserService", "User", user.getId());

            expect(events).toHaveLength(3);
        });

        it("returns an empty array when no events are found", async () => {
            const events = await service.getDomainEventsForAggregate("IAM-UserService", "User", faker.string.uuid());

            expect(events).toHaveLength(0);
        });
    });
});
