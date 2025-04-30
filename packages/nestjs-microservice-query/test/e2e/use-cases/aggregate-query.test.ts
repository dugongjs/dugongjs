import { EventSourcingService } from "@dugongjs/nestjs";
import { faker } from "@faker-js/faker";
import { app, client } from "../setup/setup/app.js";
import { User } from "./user-aggregate/domain/user.js";

describe("User", () => {
    let eventSourcingService: EventSourcingService;

    beforeEach(() => {
        eventSourcingService = app.get(EventSourcingService);
    });

    describe("getAggregateTypes", () => {
        it("should return aggregate types", async () => {
            const aggregateTypes = await client.getAggregateTypes();

            expect(aggregateTypes).toEqual(["User"]);
        });
    });

    describe("getAggregateIds", () => {
        it("should return a list of all aggregate IDs for a given aggregate type", async () => {
            const userManager = eventSourcingService.createAggregateContext(null, User);

            for await (const i of Array.from({ length: 10 })) {
                const user = new User();

                user.createUser({ email: faker.internet.email(), username: faker.internet.userName() });
                user.updateEmail({ email: faker.internet.email() });
                user.updateUsername({ username: faker.internet.userName() });
                user.deleteUser();

                await userManager.commitStagedDomainEvents(user);
            }

            const aggregateIds = await client.getAggregateIds("IAM-UserService", "User");

            expect(aggregateIds).toHaveLength(10);
        });
    });

    describe("getAggregate", () => {
        it("should return an aggregate by ID", async () => {
            const userManager = eventSourcingService.createAggregateContext(null, User);

            const user = new User();

            user.createUser({ email: faker.internet.email(), username: faker.internet.userName() });
            user.updateEmail({ email: faker.internet.email() });
            user.updateUsername({ username: faker.internet.userName() });

            await userManager.applyAndCommitStagedDomainEvents(user);

            const aggregate = await client.getAggregate(null, "User", user.getId());

            expect(aggregate).toEqual(
                expect.objectContaining({
                    id: user.getId(),
                    currentDomainEventSequenceNumber: user.getCurrentDomainEventSequenceNumber(),
                    username: user.getUsername(),
                    email: user.getEmail()
                })
            );
        });

        it("should be possible to build the aggregate up to a specific sequence number", async () => {
            const userManager = eventSourcingService.createAggregateContext(null, User);

            const user = new User();

            const initialEmail = faker.internet.email();
            const initialUsername = faker.internet.userName();

            user.createUser({ email: initialEmail, username: initialUsername });
            user.updateEmail({ email: faker.internet.email() });
            user.updateUsername({ username: faker.internet.userName() });

            await userManager.applyAndCommitStagedDomainEvents(user);

            const aggregate = await client.getAggregate(null, "User", user.getId(), 1);

            expect(aggregate).toEqual(
                expect.objectContaining({
                    id: user.getId(),
                    currentDomainEventSequenceNumber: 1,
                    username: initialUsername,
                    email: initialEmail
                })
            );
        });

        it("should return null if the aggregate does not exist", async () => {
            const aggregate = await client.getAggregate(null, "User", faker.string.uuid());

            expect(aggregate).toBeNull();
        });
    });

    describe("getDomainEventsForAggregate", () => {
        it("should return domain events for an aggregate", async () => {
            const userManager = eventSourcingService.createAggregateContext(null, User);

            const user = new User();

            user.createUser({ email: faker.internet.email(), username: faker.internet.userName() });
            user.updateEmail({ email: faker.internet.email() });
            user.updateUsername({ username: faker.internet.userName() });

            await userManager.applyAndCommitStagedDomainEvents(user);

            const domainEvents = await client.getDomainEventsForAggregate(null, "User", user.getId());

            expect(domainEvents).toHaveLength(3);
        });

        it("should return an empty array if the aggregate does not exist", async () => {
            const domainEvents = await client.getDomainEventsForAggregate(null, "User", faker.string.uuid());

            expect(domainEvents).toHaveLength(0);
        });
    });
});
