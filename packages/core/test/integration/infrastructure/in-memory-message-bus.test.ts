import { faker } from "@faker-js/faker";
import { mock, mockReset } from "vitest-mock-extended";
import { MessageSerdesInMemory } from "../../../src/adapters/common/message-broker/message-serdes-in-memory.js";
import { MessageConsumerInMemory } from "../../../src/adapters/inbound/message-broker/message-consumer-in-memory.js";
import { MessageProducerInMemory } from "../../../src/adapters/outbound/message-broker/message-producer-in-memory.js";
import { AggregateManager } from "../../../src/application/aggregate-manager/aggregate-manager.js";
import { AggregateMessageConsumer } from "../../../src/application/aggregate-message-consumer/aggregate-message-consumer.js";
import type { ILogger } from "../../../src/application/logger/i-logger.js";
import type { SerializedDomainEvent } from "../../../src/domain/abstract-domain-event/serialized-domain-event.js";
import { InMemoryMessageBus } from "../../../src/infrastructure/in-memory-message-bus/in-memory-message-bus.js";
import type { IConsumedMessageRepository } from "../../../src/ports/outbound/repository/i-consumed-message-repository.js";
import type { IDomainEventRepository } from "../../../src/ports/outbound/repository/i-domain-event-repository.js";
import type { ISnapshotRepository } from "../../../src/ports/outbound/repository/i-snapshot-repository.js";
import type { ITransactionManager } from "../../../src/ports/outbound/transaction-manager/i-transaction-manager.js";
import { UserAggregate } from "../use-cases/user.aggregate.js";

describe("InMemoryMessageBus", () => {
    let aggregateManager: AggregateManager<typeof UserAggregate>;
    let aggregateMessageConsumer: AggregateMessageConsumer<typeof UserAggregate, SerializedDomainEvent>;
    let messageBus: InMemoryMessageBus<SerializedDomainEvent>;
    let messageProducer: MessageProducerInMemory;
    let messageConsumer: MessageConsumerInMemory;
    let messageSerdes: MessageSerdesInMemory;

    const transactionManager = mock<ITransactionManager>({
        transaction: (fn) => fn({})
    });
    const domainEventRepository = mock<IDomainEventRepository>();
    const consumedMessageRepository = mock<IConsumedMessageRepository>();
    const snapshotRepository = mock<ISnapshotRepository>();
    const logger = mock<ILogger>();
    const currentOrigin = "TestOrigin";

    beforeEach(() => {
        mockReset(domainEventRepository);
        mockReset(snapshotRepository);
        mockReset(logger);

        messageBus = new InMemoryMessageBus<SerializedDomainEvent>();
        messageProducer = new MessageProducerInMemory(messageBus);
        messageConsumer = new MessageConsumerInMemory(messageBus);
        messageSerdes = new MessageSerdesInMemory();

        aggregateManager = new AggregateManager({
            aggregateClass: UserAggregate,
            transactionManager,
            domainEventRepository,
            snapshotRepository,
            messageProducer,
            messageSerdes,
            currentOrigin,
            logger
        });

        aggregateMessageConsumer = new AggregateMessageConsumer({
            aggregateClass: UserAggregate,
            domainEventRepository,
            consumedMessageRepository,
            transactionManager,
            messageConsumer,
            messageSerdes,
            currentOrigin,
            logger
        });
    });

    it("should publish and consume domain events as messages", async () => {
        const handler = vi.fn();

        aggregateMessageConsumer.registerMessageConsumerForAggregate("test-consumer", handler);

        const user = new UserAggregate();

        user.createUser(faker.internet.userName());

        const userCreatedEvent = user.getStagedDomainEvents()[0];

        await aggregateManager.transaction(async (transactionContext) => {
            await aggregateManager.applyAndCommitStagedDomainEvents(user);

            expect(handler).toHaveBeenCalledTimes(1);
            expect(handler).toHaveBeenCalledWith({
                transactionContext,
                message: userCreatedEvent.serialize(),
                domainEvent: userCreatedEvent
            });
        });
    });
});
