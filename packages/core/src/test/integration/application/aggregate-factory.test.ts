import { faker } from "@faker-js/faker";
import { mock, mockReset } from "vitest-mock-extended";
import { AggregateFactory } from "../../../application/aggregate-factory/aggregate-factory.js";
import { AggregateMetadataNotFoundError } from "../../../application/aggregate-factory/errors/aggregate-metadata-not-found.error.js";
import type { ILogger } from "../../../application/logger/i-logger.js";
import { AbstractEventSourcedAggregateRoot } from "../../../domain/abstract-event-sourced-aggregate-root/abstract-event-sourced-aggregate-root.js";
import type { IDomainEventRepository } from "../../../ports/outbound/repository/i-domain-event-repository.js";
import type {
    ISnapshotRepository,
    SerializedSnapshot
} from "../../../ports/outbound/repository/i-snapshot-repository.js";
import { UserAggregate, UserCreatedEvent, UserDeletedEvent, UserUpdatedEvent } from "../test-classes/user.aggregate.js";

describe("AggregateFactory", () => {
    let factory: AggregateFactory<typeof UserAggregate>;

    const domainEventRepository = mock<IDomainEventRepository>();
    const snapshotRepository = mock<ISnapshotRepository>();
    const logger = mock<ILogger>();
    const transactionContext = {};
    const currentOrigin = "TestOrigin";

    beforeEach(() => {
        mockReset(domainEventRepository);
        mockReset(snapshotRepository);
        mockReset(logger);
        factory = new AggregateFactory({
            aggregateClass: UserAggregate,
            transactionContext,
            domainEventRepository,
            snapshotRepository,
            currentOrigin,
            logger
        });
    });

    describe("constructor", () => {
        it("should throw an error if aggregate metadata is not found", () => {
            class AggregateWithoutMetadata extends AbstractEventSourcedAggregateRoot {}

            expect(
                () =>
                    new AggregateFactory({
                        aggregateClass: AggregateWithoutMetadata,
                        transactionContext,
                        domainEventRepository,
                        snapshotRepository,
                        currentOrigin,
                        logger
                    })
            ).toThrowError(AggregateMetadataNotFoundError);
        });
    });

    describe("build", () => {
        it("should build an aggregate from the latest snapshot if snapshotable and skipSnapshot is not set", async () => {
            const userId = faker.string.uuid();

            const snapshot: SerializedSnapshot = {
                aggregateId: userId,
                domainEventSequenceNumber: 1,
                snapshot: {
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

        it("should build an aggregate from the event log if skipSnapshot is set", async () => {
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

        it("should return null if the aggregate is deleted and returnDeleted is not set", async () => {
            const userId = faker.string.uuid();

            const snapshot: SerializedSnapshot = {
                aggregateId: userId,
                domainEventSequenceNumber: 3,
                snapshot: {
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

        it("should return the deleted aggregate if returnDeleted is set", async () => {
            const userId = faker.string.uuid();

            const snapshot: SerializedSnapshot = {
                aggregateId: userId,
                domainEventSequenceNumber: 3,
                snapshot: {
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

        it("should return null if no snapshot or events are found", async () => {
            const userId = faker.string.uuid();

            snapshotRepository.getLatestSnapshot.mockResolvedValueOnce(null);
            domainEventRepository.getAggregateDomainEvents.mockResolvedValueOnce([]);

            const user = await factory.build(userId);

            expect(user).toBeNull();
        });
    });

    describe("buildFromEventLog", () => {
        it("should create an instance of the aggregate class", async () => {
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

        it("should create an instance of the aggregate class from several events", async () => {
            const userId = faker.string.uuid();

            const userCreatedEvent = new UserCreatedEvent(userId, {
                username: faker.internet.userName()
            });

            const userUpdatedEvent1 = new UserCreatedEvent(userId, {
                username: faker.internet.userName()
            });

            const userUpdatedEvent2 = new UserCreatedEvent(userId, {
                username: faker.internet.userName()
            });

            const userUpdatedEvent3 = new UserCreatedEvent(userId, {
                username: faker.internet.userName()
            });

            const UserDeletedEvent = new UserCreatedEvent(userId, {
                username: faker.internet.userName()
            });

            domainEventRepository.getAggregateDomainEvents.mockResolvedValueOnce(
                [userCreatedEvent, userUpdatedEvent1, userUpdatedEvent2, userUpdatedEvent3, UserDeletedEvent].map(
                    (event, index) =>
                        event
                            .setAggregateId(userId)
                            .setSequenceNumber(index + 1)
                            .setTimestamp(faker.date.recent())
                            .serialize()
                )
            );
        });

        it("should return null if no events are found", async () => {
            const userId = faker.string.uuid();

            domainEventRepository.getAggregateDomainEvents.mockResolvedValueOnce([]);

            const user = await factory.buildFromEventLog(userId);

            expect(user).toBeNull();
        });
    });

    describe("buildFromLatestSnapshot", () => {
        it("should create an instance of the aggregate class from the latest snapshot", async () => {
            const userId = faker.string.uuid();

            const snapshot: SerializedSnapshot = {
                aggregateId: userId,
                domainEventSequenceNumber: 1,
                snapshot: {
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

        it("should create an instance of the aggregate class from the latest snapshot and apply events", async () => {
            const userId = faker.string.uuid();

            const snapshot: SerializedSnapshot = {
                aggregateId: userId,
                domainEventSequenceNumber: 3,
                snapshot: {
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

        it("should return null if no snapshot is found", async () => {
            const userId = faker.string.uuid();

            snapshotRepository.getLatestSnapshot.mockResolvedValueOnce(null);

            const user = await factory.buildFromLatestSnapshot(userId);

            expect(user).toBeNull();
        });
    });
});
