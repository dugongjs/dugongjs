import type { ITransactionManager } from "@dugongjs/core";
import { faker } from "@faker-js/faker";
import { mock } from "vitest-mock-extended";
import { DomainEventEntity } from "../../../src/infrastructure/db/entities/domain-event.entity.js";
import { OutboxEntity } from "../../../src/infrastructure/db/entities/outbox-entity.js";
import { SnapshotEntity } from "../../../src/infrastructure/db/entities/snapshot.entity.js";
import { AggregateFactoryTypeOrm } from "../setup/app/aggregate-factory-typeorm.js";
import { AggregateManagerTypeOrm } from "../setup/app/aggregate-manager-typeorm.js";
import { dataSource } from "../setup/setup/data-source.js";
import { User } from "./user-aggregate/user.js";

describe("User", () => {
    let userFactory: AggregateFactoryTypeOrm<typeof User>;
    let userManager: AggregateManagerTypeOrm<typeof User>;

    beforeEach(() => {
        userFactory = new AggregateFactoryTypeOrm({
            aggregateClass: User,
            currentOrigin: "IAM-UserService",
            transactionManager: mock<ITransactionManager>()
        });

        userManager = new AggregateManagerTypeOrm({
            aggregateClass: User,
            currentOrigin: "IAM-UserService",
            transactionManager: mock<ITransactionManager>()
        });
    });

    describe("create", () => {
        it("should create a user and persist the event", async () => {
            const user = new User();

            const email = faker.internet.email();
            const username = faker.internet.userName();

            user.createUser({ email, username });

            await userManager.commitStagedDomainEvents(user);

            const persistedEvents = await dataSource.getRepository(DomainEventEntity).find({});
            const userCreatedEvent = persistedEvents[0];

            expect(persistedEvents).toHaveLength(1);
            expect(userCreatedEvent.id).toBeDefined();
            expect(userCreatedEvent.type).toBe("UserCreated");
            expect(userCreatedEvent.version).toBe(1);
            expect(userCreatedEvent.origin).toBe("IAM-UserService");
            expect(userCreatedEvent.aggregateType).toBe("User");
            expect(userCreatedEvent.aggregateId).toBe(user.getId());
            expect(userCreatedEvent.sequenceNumber).toBe(1);
            expect(userCreatedEvent.timestamp).toBeInstanceOf(Date);
            expect(userCreatedEvent.payload).toEqual({ email, username });
        });

        it("should create a user and persist the event with triggeredByUserId", async () => {
            const user = new User();

            const email = faker.internet.email();
            const username = faker.internet.userName();

            const triggeredByUserId = faker.string.uuid();

            user.createUser({ email, username });

            await userManager.commitStagedDomainEvents(user, { triggeredByUserId });

            const persistedEvents = await dataSource.getRepository(DomainEventEntity).find({});
            const userCreatedEvent = persistedEvents[0];

            expect(userCreatedEvent.triggeredByUserId).toBe(triggeredByUserId);
        });

        it("should create a user and persist the event with triggeredByEventId", async () => {
            const user = new User();

            const email = faker.internet.email();
            const username = faker.internet.userName();

            const triggeredByEventId = faker.string.uuid();

            user.createUser({ email, username });

            await userManager.commitStagedDomainEvents(user, { triggeredByEventId });

            const persistedEvents = await dataSource.getRepository(DomainEventEntity).find({});
            const userCreatedEvent = persistedEvents[0];

            expect(userCreatedEvent.triggeredByEventId).toBe(triggeredByEventId);
        });

        it("should create a user and persist the event with correlationId", async () => {
            const user = new User();

            const email = faker.internet.email();
            const username = faker.internet.userName();

            const correlationId = faker.string.uuid();

            user.createUser({ email, username });

            await userManager.commitStagedDomainEvents(user, { correlationId });

            const persistedEvents = await dataSource.getRepository(DomainEventEntity).find({});
            const userCreatedEvent = persistedEvents[0];

            expect(userCreatedEvent.correlationId).toBe(correlationId);
        });

        it("should create a user and persist the event with metadata", async () => {
            const user = new User();

            const email = faker.internet.email();
            const username = faker.internet.userName();

            const metadata = {
                key1: "value1",
                key2: "value2"
            };

            user.createUser({ email, username });

            await userManager.commitStagedDomainEvents(user, { metadata });

            const persistedEvents = await dataSource.getRepository(DomainEventEntity).find({});
            const userCreatedEvent = persistedEvents[0];

            expect(userCreatedEvent.metadata).toStrictEqual(metadata);
        });

        it("should create a user and publish the event to the outbox", async () => {
            const user = new User();

            const email = faker.internet.email();
            const username = faker.internet.userName();

            user.createUser({ email, username });

            await userManager.commitStagedDomainEvents(user);

            const outbox = await dataSource.getRepository(OutboxEntity).find({});
            const userCreatedOutboxMessage = outbox[0];

            expect(userCreatedOutboxMessage.id).toBeDefined();
            expect(userCreatedOutboxMessage.type).toBe("UserCreated");
            expect(userCreatedOutboxMessage.version).toBe(1);
            expect(userCreatedOutboxMessage.origin).toBe("IAM-UserService");
            expect(userCreatedOutboxMessage.aggregateType).toBe("User");
            expect(userCreatedOutboxMessage.aggregateId).toBe(user.getId());
            expect(userCreatedOutboxMessage.sequenceNumber).toBe(1);
            expect(userCreatedOutboxMessage.timestamp).toBeInstanceOf(Date);
            expect(userCreatedOutboxMessage.payload).toEqual({
                email,
                username
            });
            expect(userCreatedOutboxMessage.channelId).toBe("iam-user-service-user");
        });

        it("should correctly update the state when the event is applied", async () => {
            const user = new User();

            const email = faker.internet.email();
            const username = faker.internet.userName();

            user.createUser({ email, username });

            userManager.applyStagedDomainEvents(user);

            expect(user.getId()).toBeDefined();
            expect(user.getEmail()).toBe(email);
            expect(user.getUsername()).toBe(username);
        });
    });

    describe("updateEmail", () => {
        let userId: string;

        beforeEach(async () => {
            const email = faker.internet.email();
            const username = faker.internet.userName();

            const user = new User();
            user.createUser({ email, username });

            await userManager.commitStagedDomainEvents(user);

            userId = user.getId();
        });

        it("should reconstruct the user, update the email and persist the event", async () => {
            const user = await userFactory.build(userId);

            if (!user) {
                throw new Error("User not found");
            }

            const newEmail = faker.internet.email();

            user.updateEmail({ email: newEmail });

            await userManager.applyAndCommitStagedDomainEvents(user);

            const persistedEvents = await dataSource.getRepository(DomainEventEntity).find({});

            expect(persistedEvents).toHaveLength(2);
            expect(user.getEmail()).toBe(newEmail);
        });

        it("should take a snapshot after the snapshot interval has been reached", async () => {
            const user = await userFactory.build(userId);

            if (!user) {
                throw new Error("User not found");
            }

            user.updateEmail({ email: faker.internet.email() });
            user.updateEmail({ email: faker.internet.email() });
            user.updateEmail({ email: faker.internet.email() });
            user.updateEmail({ email: faker.internet.email() });
            user.updateEmail({ email: faker.internet.email() });
            user.updateEmail({ email: faker.internet.email() });
            user.updateEmail({ email: faker.internet.email() });
            user.updateEmail({ email: faker.internet.email() });
            user.updateEmail({ email: faker.internet.email() });

            await userManager.applyAndCommitStagedDomainEvents(user);

            const persistedEvents = await dataSource.getRepository(DomainEventEntity).find({});

            const snapshots = await dataSource.getRepository(SnapshotEntity).find({});
            const snapshot = snapshots[0];

            expect(persistedEvents).toHaveLength(10);
            expect(snapshots).toHaveLength(1);

            expect(snapshot.id).toBeDefined();
            expect(snapshot.origin).toBe("IAM-UserService");
            expect(snapshot.aggregateType).toBe("User");
            expect(snapshot.aggregateId).toBe(user.getId());
            expect(snapshot.domainEventSequenceNumber).toBe(10);
            expect(snapshot.snapshotData).toEqual(
                expect.objectContaining({
                    id: user.getId(),
                    email: user.getEmail(),
                    username: user.getUsername(),
                    currentDomainEventSequenceNumber: 10
                })
            );
        });

        it("should restore the user from the snapshot and update the email", async () => {
            const user = await userFactory.build(userId);

            if (!user) {
                throw new Error("User not found");
            }

            user.updateEmail({ email: faker.internet.email() });
            user.updateEmail({ email: faker.internet.email() });
            user.updateEmail({ email: faker.internet.email() });
            user.updateEmail({ email: faker.internet.email() });
            user.updateEmail({ email: faker.internet.email() });
            user.updateEmail({ email: faker.internet.email() });
            user.updateEmail({ email: faker.internet.email() });
            user.updateEmail({ email: faker.internet.email() });
            user.updateEmail({ email: faker.internet.email() });

            await userManager.applyAndCommitStagedDomainEvents(user);

            const snapshots = await dataSource.getRepository(SnapshotEntity).find({});

            expect(snapshots).toHaveLength(1);

            const restoredUser = await userFactory.build(userId);

            if (!restoredUser) {
                throw new Error("User not found");
            }

            const newEmail = faker.internet.email();

            restoredUser.updateEmail({ email: newEmail });

            await userManager.applyAndCommitStagedDomainEvents(restoredUser);

            expect(restoredUser.getEmail()).toBe(newEmail);
        });

        it("should be possible to execute additional commands after restoring from a snapshot", async () => {
            const user = await userFactory.build(userId);

            if (!user) {
                throw new Error("User not found");
            }

            user.updateEmail({ email: faker.internet.email() });
            user.updateEmail({ email: faker.internet.email() });
            user.updateEmail({ email: faker.internet.email() });
            user.updateEmail({ email: faker.internet.email() });
            user.updateEmail({ email: faker.internet.email() });
            user.updateEmail({ email: faker.internet.email() });
            user.updateEmail({ email: faker.internet.email() });
            user.updateEmail({ email: faker.internet.email() });
            user.updateEmail({ email: faker.internet.email() });

            await userManager.applyAndCommitStagedDomainEvents(user);

            const snapshots = await dataSource.getRepository(SnapshotEntity).find({});

            expect(snapshots).toHaveLength(1);

            const restoredUser = await userFactory.build(userId);

            if (!restoredUser) {
                throw new Error("User not found");
            }

            const newEmail = faker.internet.email();

            restoredUser.updateEmail({ email: newEmail });

            await userManager.applyAndCommitStagedDomainEvents(restoredUser);

            expect(restoredUser.getEmail()).toBe(newEmail);

            const restoredUserAfterUpdate = await userFactory.build(userId);

            if (!restoredUserAfterUpdate) {
                throw new Error("User not found");
            }

            const newEmail2 = faker.internet.email();

            restoredUser.updateEmail({ email: newEmail2 });

            restoredUserAfterUpdate.updateEmail({ email: newEmail2 });

            await userManager.applyAndCommitStagedDomainEvents(restoredUserAfterUpdate);

            expect(restoredUserAfterUpdate.getEmail()).toBe(newEmail2);
        });
    });

    describe("deleteUser", () => {
        let userId: string;

        beforeEach(async () => {
            const email = faker.internet.email();
            const username = faker.internet.userName();

            const user = new User();
            user.createUser({ email, username });

            await userManager.commitStagedDomainEvents(user);

            userId = user.getId();
        });

        it("should delete the user", async () => {
            const user = await userFactory.build(userId);

            if (!user) {
                throw new Error("User not found");
            }

            user.deleteUser();

            await userManager.applyAndCommitStagedDomainEvents(user);

            const persistedEvents = await dataSource.getRepository(DomainEventEntity).find({});

            expect(persistedEvents).toHaveLength(2);
            expect(user.isDeleted()).toBe(true);
        });

        it("should return null when trying to restore a deleted user through the factory", async () => {
            const user = await userFactory.build(userId);

            if (!user) {
                throw new Error("User not found");
            }

            user.deleteUser();

            await userManager.applyAndCommitStagedDomainEvents(user);

            const deletedUser = await userFactory.build(userId);

            expect(deletedUser).toBeNull();
        });

        it("should return the deleted user when trying to restore a deleted user through the factory with returnDeleted", async () => {
            const user = await userFactory.build(userId);

            if (!user) {
                throw new Error("User not found");
            }

            user.deleteUser();

            await userManager.applyAndCommitStagedDomainEvents(user);

            const deletedUser = await userFactory.build(userId, { returnDeleted: true });

            expect(deletedUser).toBeInstanceOf(User);
            expect(deletedUser?.isDeleted()).toBe(true);
        });
    });
});
