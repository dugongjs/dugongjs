import { faker } from "@faker-js/faker";
import { AggregateManagerTypeOrm } from "../setup/app/aggregate-manager-typeorm.js";
import { AggregateQueryServiceTypeOrm } from "../setup/app/aggregate-query-service-typeorm.js";
import { User } from "./user-aggregate/user.js";

describe("AggregateQueryService", () => {
    let userManager: AggregateManagerTypeOrm<typeof User>;
    let service: AggregateQueryServiceTypeOrm;

    beforeEach(() => {
        userManager = new AggregateManagerTypeOrm({
            aggregateClass: User,
            transactionContext: null,
            currentOrigin: "IAM-UserService"
        });

        service = new AggregateQueryServiceTypeOrm({
            currentOrigin: "IAM-UserService"
        });
    });

    describe("getAggregateTypes", () => {
        it("should return aggregate types", async () => {
            const aggregateTypes = await service.getAggregateTypes();

            expect(aggregateTypes).toEqual(["User"]);
        });
    });

    describe("getAggregateIds", () => {
        it("should return aggregate ids", async () => {
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

        it("should include ids for deleted aggregates", async () => {
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

    describe("getAggregate", () => {
        it("should return aggregate", async () => {
            const finalUsername = faker.internet.userName();
            const finalEmail = faker.internet.email();

            const user = new User();

            user.createUser({ email: faker.internet.email(), username: faker.internet.userName() });
            user.updateUsername({ username: finalUsername });
            user.updateEmail({ email: finalEmail });

            await userManager.commitStagedDomainEvents(user);

            const aggregate = await service.getAggregate(null, "User", user.getId());
            const userAggregate = aggregate as User;

            expect(aggregate).toBeInstanceOf(User);
            expect(userAggregate.getUsername()).toEqual(finalUsername);
            expect(userAggregate.getEmail()).toEqual(finalEmail);
        });

        it("should be possible to build the aggregate up to a specific sequence number", async () => {
            const initialUsername = faker.internet.userName();
            const initialEmail = faker.internet.email();

            const user = new User();

            user.createUser({ email: initialEmail, username: initialUsername });
            user.updateUsername({ username: faker.internet.userName() });
            user.updateEmail({ email: faker.internet.email() });

            await userManager.commitStagedDomainEvents(user);

            const aggregate = await service.getAggregate(null, "User", user.getId(), 1);
            const userAggregate = aggregate as User;

            expect(aggregate).toBeInstanceOf(User);
            expect(userAggregate.getUsername()).toEqual(initialUsername);
            expect(userAggregate.getEmail()).toEqual(initialEmail);
        });

        it("should return null if aggregate not found", async () => {
            const aggregate = await service.getAggregate("IAM-UserService", "User", faker.string.uuid());

            expect(aggregate).toBeNull();
        });
    });

    describe("getDomainEventsForAggregate", () => {
        it("should return domain events for aggregate", async () => {
            const user = new User();

            user.createUser({ email: faker.internet.email(), username: faker.internet.userName() });
            user.updateEmail({ email: faker.internet.email() });
            user.updateUsername({ username: faker.internet.userName() });

            await userManager.commitStagedDomainEvents(user);

            const events = await service.getDomainEventsForAggregate("IAM-UserService", "User", user.getId());

            expect(events).toHaveLength(3);
        });

        it("should return empty array if no events found", async () => {
            const events = await service.getDomainEventsForAggregate("IAM-UserService", "User", faker.string.uuid());

            expect(events).toHaveLength(0);
        });
    });
});
