import { EventSourcingService } from "@dugongjs/nestjs";
import { faker } from "@faker-js/faker";
import { User } from "../fixtures/user/domain/user.js";
import { app, client } from "../setup/setup/app.js";

describe("aggregate query behavior", () => {
    let eventSourcingService: EventSourcingService;

    beforeEach(() => {
        eventSourcingService = app.get(EventSourcingService);
    });

    describe("when listing aggregate types", () => {
        it("should return available aggregate types", async () => {
            const aggregateTypes = await client.getAggregateTypes();

            expect(aggregateTypes).toEqual(["User"]);
        });
    });

    describe("when listing aggregate ids", () => {
        it("should return all aggregate ids for a given aggregate type", async () => {
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

    describe("when rebuilding an aggregate", () => {
        it("should return an aggregate by id", async () => {
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

        it("should support rebuilding up to a specific sequence number", async () => {
            const userManager = eventSourcingService.createAggregateContext(null, User);

            const user = new User();

            const initialEmail = faker.internet.email();
            const initialUsername = faker.internet.userName();

            user.createUser({ email: initialEmail, username: initialUsername });
            user.updateEmail({ email: faker.internet.email() });
            user.updateUsername({ username: faker.internet.userName() });

            await userManager.applyAndCommitStagedDomainEvents(user);

            const aggregate = await client.getAggregate(null, "User", user.getId(), null, 1);

            expect(aggregate).toEqual(
                expect.objectContaining({
                    id: user.getId(),
                    currentDomainEventSequenceNumber: 1,
                    username: initialUsername,
                    email: initialEmail
                })
            );
        });

        it("should return null when the aggregate does not exist", async () => {
            const aggregate = await client.getAggregate(null, "User", faker.string.uuid());

            expect(aggregate).toBeNull();
        });
    });

    describe("when reading aggregate events", () => {
        it("should return events for an aggregate", async () => {
            const userManager = eventSourcingService.createAggregateContext(null, User);

            const user = new User();

            user.createUser({ email: faker.internet.email(), username: faker.internet.userName() });
            user.updateEmail({ email: faker.internet.email() });
            user.updateUsername({ username: faker.internet.userName() });

            await userManager.applyAndCommitStagedDomainEvents(user);

            const domainEvents = await client.getDomainEventsForAggregate(null, "User", user.getId());

            expect(domainEvents).toHaveLength(3);
        });

        it("should return an empty array when the aggregate does not exist", async () => {
            const domainEvents = await client.getDomainEventsForAggregate(null, "User", faker.string.uuid());

            expect(domainEvents).toHaveLength(0);
        });
    });
});
