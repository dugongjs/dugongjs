import { faker } from "@faker-js/faker";
import { mock, mockReset } from "vitest-mock-extended";
import { AggregateFactory } from "../../../src/application/aggregate-factory/aggregate-factory.js";
import { AggregateMetadataNotFoundError } from "../../../src/application/aggregate-factory/errors/aggregate-metadata-not-found.error.js";
import type { ILogger } from "../../../src/application/logger/i-logger.js";
import { AbstractEventSourcedAggregateRoot } from "../../../src/domain/abstract-event-sourced-aggregate-root/abstract-event-sourced-aggregate-root.js";
import type { IDomainEventRepository } from "../../../src/ports/outbound/repository/i-domain-event-repository.js";
import type {
    ISnapshotRepository,
    SerializedSnapshot
} from "../../../src/ports/outbound/repository/i-snapshot-repository.js";
import type { ITransactionManager } from "../../../src/ports/outbound/transaction-manager/i-transaction-manager.js";
import { UserAggregate, UserCreatedEvent, UserDeletedEvent, UserUpdatedEvent } from "../fixtures/user.aggregate.js";

describe("aggregate factory integration behavior", () => {
    let factory: AggregateFactory<typeof UserAggregate>;

    const transactionManager = mock<ITransactionManager>();
    const domainEventRepository = mock<IDomainEventRepository>();
    const snapshotRepository = mock<ISnapshotRepository>();
    const logger = mock<ILogger>();
    const currentOrigin = "TestOrigin";

    beforeEach(() => {
        mockReset(domainEventRepository);
        mockReset(snapshotRepository);
        mockReset(logger);
        factory = new AggregateFactory({
            aggregateClass: UserAggregate,
            transactionManager,
            domainEventRepository,
            snapshotRepository,
            currentOrigin,
            logger
        });
    });

    describe("constructor behavior", () => {
        it("should throw aggregate metadata error for undecorated aggregate classes", () => {
            class AggregateWithoutMetadata extends AbstractEventSourcedAggregateRoot {}

            expect(
                () =>
                    new AggregateFactory({
                        aggregateClass: AggregateWithoutMetadata,
                        transactionManager,
                        domainEventRepository,
                        snapshotRepository,
                        currentOrigin,
                        logger
                    })
            ).toThrowError(AggregateMetadataNotFoundError);
        });
    });

    describe("build behavior", () => {
        it("should build from the latest snapshot when snapshot loading is enabled", async () => {
            const userId = faker.string.uuid();

            const snapshot: SerializedSnapshot = {
                aggregateId: userId,
                domainEventSequenceNumber: 1,
                snapshotData: {
                    username: faker.internet.userName()
                },
                origin: currentOrigin,
                aggregateType: "User"
            };

            snapshotRepository.getLatestSnapshot.mockResolvedValueOnce(snapshot);
            domainEventRepository.getAggregateDomainEvents.mockResolvedValueOnce([]);

            const user = await factory.build(userId);

            expect(user).toBeInstanceOf(UserAggregate);
        });

        it("should build from event history when snapshot loading is skipped", async () => {
            const userId = faker.string.uuid();

            domainEventRepository.getAggregateDomainEvents.mockResolvedValueOnce([
                new UserCreatedEvent(userId, {
                    username: faker.internet.userName()
                })
                    .setSequenceNumber(1)
                    .setAggregateId(userId)
                    .setTimestamp(faker.date.recent())
                    .serialize()
            ]);

            const user = await factory.build(userId, { skipSnapshot: true });

            expect(user).toBeInstanceOf(UserAggregate);
        });

        it("should return null for deleted aggregates unless returnDeleted is enabled", async () => {
            const userId = faker.string.uuid();

            const snapshot: SerializedSnapshot = {
                aggregateId: userId,
                domainEventSequenceNumber: 3,
                snapshotData: {
                    username: faker.internet.userName()
                },
                origin: currentOrigin,
                aggregateType: "User"
            };

            const userDeletedEvent = new UserDeletedEvent(userId);

            snapshotRepository.getLatestSnapshot.mockResolvedValueOnce(snapshot);
            domainEventRepository.getAggregateDomainEvents.mockResolvedValueOnce([
                userDeletedEvent
                    .setAggregateId(userId)
                    .setSequenceNumber(4)
                    .setTimestamp(faker.date.recent())
                    .serialize()
            ]);

            const user = await factory.build(userId);

            expect(user).toBeNull();
        });

        it("should return deleted aggregates when returnDeleted is enabled", async () => {
            const userId = faker.string.uuid();

            const snapshot: SerializedSnapshot = {
                aggregateId: userId,
                domainEventSequenceNumber: 3,
                snapshotData: {
                    username: faker.internet.userName()
                },
                origin: currentOrigin,
                aggregateType: "User"
            };

            const userDeletedEvent = new UserDeletedEvent(userId);

            snapshotRepository.getLatestSnapshot.mockResolvedValueOnce(snapshot);
            domainEventRepository.getAggregateDomainEvents.mockResolvedValueOnce([
                userDeletedEvent
                    .setAggregateId(userId)
                    .setSequenceNumber(4)
                    .setTimestamp(faker.date.recent())
                    .serialize()
            ]);

            const user = await factory.build(userId, { returnDeleted: true });

            expect(user).toBeInstanceOf(UserAggregate);
            expect(user?.isDeleted()).toBe(true);
        });

        it("should return null when no snapshot or events exist", async () => {
            const userId = faker.string.uuid();

            snapshotRepository.getLatestSnapshot.mockResolvedValueOnce(null);
            domainEventRepository.getAggregateDomainEvents.mockResolvedValueOnce([]);

            const user = await factory.build(userId);

            expect(user).toBeNull();
        });
    });

    describe("buildFromEventLog behavior", () => {
        it("should rehydrate an aggregate from a single event", async () => {
            const userId = faker.string.uuid();

            domainEventRepository.getAggregateDomainEvents.mockResolvedValueOnce([
                new UserCreatedEvent(userId, {
                    username: faker.internet.userName()
                })
                    .setSequenceNumber(1)
                    .setAggregateId(userId)
                    .setTimestamp(faker.date.recent())
                    .serialize()
            ]);

            const user = await factory.buildFromEventLog(userId);

            expect(user).toBeInstanceOf(UserAggregate);
        });

        it("should rehydrate aggregate state from a multi-event history", async () => {
            const userId = faker.string.uuid();
            const createdUsername = faker.internet.userName();
            const updatedUsernameA = faker.internet.userName();
            const updatedUsernameB = faker.internet.userName();
            const updatedUsernameC = faker.internet.userName();

            const userCreatedEvent = new UserCreatedEvent(userId, {
                username: createdUsername
            });

            const userUpdatedEvent1 = new UserUpdatedEvent(userId, {
                username: updatedUsernameA
            });

            const userUpdatedEvent2 = new UserUpdatedEvent(userId, {
                username: updatedUsernameB
            });

            const userUpdatedEvent3 = new UserUpdatedEvent(userId, {
                username: updatedUsernameC
            });

            const userDeletedEvent = new UserDeletedEvent(userId);

            domainEventRepository.getAggregateDomainEvents.mockResolvedValueOnce(
                [userCreatedEvent, userUpdatedEvent1, userUpdatedEvent2, userUpdatedEvent3, userDeletedEvent].map(
                    (event, index) =>
                        event
                            .setAggregateId(userId)
                            .setSequenceNumber(index + 1)
                            .setTimestamp(faker.date.recent())
                            .serialize()
                )
            );

            const user = await factory.buildFromEventLog(userId);

            expect(user).toBeInstanceOf(UserAggregate);
            expect(user?.getUsername()).toBe(updatedUsernameC);
            expect(user?.isDeleted()).toBe(true);
        });

        it("should return null when event history is empty", async () => {
            const userId = faker.string.uuid();

            domainEventRepository.getAggregateDomainEvents.mockResolvedValueOnce([]);

            const user = await factory.buildFromEventLog(userId);

            expect(user).toBeNull();
        });
    });

    describe("buildFromLatestSnapshot behavior", () => {
        it("should rehydrate from the latest snapshot when available", async () => {
            const userId = faker.string.uuid();

            const snapshot: SerializedSnapshot = {
                aggregateId: userId,
                domainEventSequenceNumber: 1,
                snapshotData: {
                    username: faker.internet.userName()
                },
                origin: currentOrigin,
                aggregateType: "User"
            };

            snapshotRepository.getLatestSnapshot.mockResolvedValueOnce(snapshot);
            domainEventRepository.getAggregateDomainEvents.mockResolvedValueOnce([]);

            const user = await factory.buildFromLatestSnapshot(userId);

            expect(user).toBeInstanceOf(UserAggregate);
        });

        it("should apply newer events after rehydrating from the latest snapshot", async () => {
            const userId = faker.string.uuid();

            const snapshot: SerializedSnapshot = {
                aggregateId: userId,
                domainEventSequenceNumber: 3,
                snapshotData: {
                    username: faker.internet.userName()
                },
                origin: currentOrigin,
                aggregateType: "User"
            };

            const userCreatedEvent = new UserCreatedEvent(userId, {
                username: faker.internet.userName()
            });
            const userUpdatedEvent = new UserUpdatedEvent(userId, {
                username: faker.internet.userName()
            });
            const userDeletedEvent = new UserDeletedEvent(userId);

            snapshotRepository.getLatestSnapshot.mockResolvedValueOnce(snapshot);
            domainEventRepository.getAggregateDomainEvents.mockResolvedValueOnce(
                [userCreatedEvent, userUpdatedEvent, userDeletedEvent].map((event, index) =>
                    event
                        .setAggregateId(userId)
                        .setSequenceNumber(index + 4)
                        .setTimestamp(faker.date.recent())
                        .serialize()
                )
            );

            const user = await factory.buildFromLatestSnapshot(userId);

            expect(user).toBeInstanceOf(UserAggregate);
            expect(user?.isDeleted()).toBe(true);
        });

        it("should return null when no snapshot exists", async () => {
            const userId = faker.string.uuid();

            snapshotRepository.getLatestSnapshot.mockResolvedValueOnce(null);

            const user = await factory.buildFromLatestSnapshot(userId);

            expect(user).toBeNull();
        });
    });
});
