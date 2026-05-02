import { AggregateFactory, WaitForMessageConsumer } from "@dugongjs/core";
import { MessageBuilder } from "@dugongjs/testing";
import { faker } from "@faker-js/faker";
import { OutboundMessageMapperKafkaJs } from "../../../src/adapters/outbound/message-broker/outbound-message-mapper-kafkajs.js";
import { Account } from "../fixtures/account/account.aggregate.js";
import { AccountClosedEvent } from "../fixtures/account/domain-events/account-closed.event.js";
import { AccountOpenedEvent } from "../fixtures/account/domain-events/account-opened.event.js";
import { MoneyDepositedEvent } from "../fixtures/account/domain-events/money-deposited.event.js";
import { MoneyWithdrawnEvent } from "../fixtures/account/domain-events/money-withdrawn.event.js";
import { AggregateFactoryTypeOrm } from "../setup/app/aggregate-factory-typeorm.js";
import { AggregateMessageConsumerKafkaJs } from "../setup/app/aggregate-message-consumer-kafkajs.js";
import { AggregateMessageProducerKafkaJs } from "../setup/app/aggregate-message-producer-kafkajs.js";
import { WaitForMessageConsumerKafkaJs } from "../setup/app/wait-for-message-consumer-kafkajs.js";

describe("message consumption behavior", () => {
    let accountMessageConsumer: AggregateMessageConsumerKafkaJs<typeof Account>;
    let accountMessageProducer: AggregateMessageProducerKafkaJs<typeof Account>;
    let accountFactory: AggregateFactory<typeof Account>;
    let waitForMessageConsumer: WaitForMessageConsumer;

    const mockHandleMessage = vi.fn();

    beforeAll(async () => {
        accountMessageConsumer = new AggregateMessageConsumerKafkaJs({
            aggregateClass: Account,
            currentOrigin: "TestOrigin"
        });
        accountMessageProducer = new AggregateMessageProducerKafkaJs({
            aggregateClass: Account,
            currentOrigin: "TestOrigin"
        });
        accountFactory = new AggregateFactoryTypeOrm({
            aggregateClass: Account,
            currentOrigin: "TestOrigin"
        });
        waitForMessageConsumer = new WaitForMessageConsumerKafkaJs({
            aggregateClass: Account,
            currentOrigin: "TestOrigin"
        });

        await accountMessageConsumer.registerMessageConsumerForAggregate("TestConsumer", mockHandleMessage);
        await accountMessageProducer.connect();
    });

    afterAll(async () => {
        await accountMessageConsumer.disconnect();
        await accountMessageProducer.disconnect();
    });

    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe("when consuming creation events", () => {
        it("should rebuild an aggregate from the consumed event", async () => {
            const accountId = faker.string.uuid();
            const initialAmount = faker.number.int({ min: 0, max: 1000 });
            const owner = faker.person.fullName();

            const { domainEvents, domainEventIds } = new MessageBuilder({
                outboundMessageMapper: new OutboundMessageMapperKafkaJs()
            })
                .addDomainEvent(
                    new AccountOpenedEvent(accountId, {
                        owner,
                        initialAmount
                    })
                )
                .build();

            await accountMessageProducer.publishDomainEventsAsMessages(domainEvents);
            await waitForMessageConsumer.waitForMessagesToBeConsumed("TestConsumer", ...domainEventIds);

            const account = (await accountFactory.build(accountId))!;

            expect(account).toBeDefined();
            expect(account.getId()).toEqual(accountId);
            expect(account.getOwner()).toEqual(owner);
            expect(account.getBalance()).toEqual(initialAmount);
        });
    });

    describe("when consuming deletion events", () => {
        it("should treat the aggregate as deleted after consumption", async () => {
            const accountId = faker.string.uuid();
            const initialAmount = faker.number.int({ min: 0, max: 1000 });
            const owner = faker.person.fullName();

            const { domainEvents, domainEventIds } = new MessageBuilder({
                outboundMessageMapper: new OutboundMessageMapperKafkaJs()
            })
                .addDomainEvent(
                    new AccountOpenedEvent(accountId, {
                        owner,
                        initialAmount
                    }),
                    new AccountClosedEvent(accountId)
                )
                .build();

            await accountMessageProducer.publishDomainEventsAsMessages(domainEvents);
            await waitForMessageConsumer.waitForMessagesToBeConsumed("TestConsumer", ...domainEventIds);

            const closedAccount = (await accountFactory.build(accountId))!;

            expect(closedAccount).toBeNull();
        });
    });

    describe("when consuming increment events", () => {
        it("should apply the increment to aggregate state", async () => {
            const accountId = faker.string.uuid();
            const initialAmount = faker.number.int({ min: 0, max: 1000 });
            const depositAmount = faker.number.int({ min: 1, max: 100 });
            const owner = faker.person.fullName();

            const { domainEvents, domainEventIds } = new MessageBuilder({
                outboundMessageMapper: new OutboundMessageMapperKafkaJs()
            })
                .addDomainEvent(
                    new AccountOpenedEvent(accountId, {
                        owner,
                        initialAmount
                    }),
                    new MoneyDepositedEvent(accountId, {
                        amount: depositAmount
                    })
                )
                .build();

            await accountMessageProducer.publishDomainEventsAsMessages(domainEvents);
            await waitForMessageConsumer.waitForMessagesToBeConsumed("TestConsumer", ...domainEventIds);

            const account = (await accountFactory.build(accountId))!;

            expect(account).toBeDefined();
            expect(account.getId()).toEqual(accountId);
            expect(account.getOwner()).toEqual(owner);
            expect(account.getBalance()).toEqual(initialAmount + depositAmount);
        });
    });

    describe("when consuming decrement events", () => {
        it("should apply the decrement to aggregate state", async () => {
            const accountId = faker.string.uuid();
            const initialAmount = faker.number.int({ min: 0, max: 1000 });
            const withdrawAmount = faker.number.int({ min: 1, max: 100 });
            const owner = faker.person.fullName();

            const { domainEvents, domainEventIds } = new MessageBuilder({
                outboundMessageMapper: new OutboundMessageMapperKafkaJs()
            })
                .addDomainEvent(
                    new AccountOpenedEvent(accountId, {
                        owner,
                        initialAmount
                    }),
                    new MoneyWithdrawnEvent(accountId, {
                        amount: withdrawAmount
                    })
                )
                .build();

            await accountMessageProducer.publishDomainEventsAsMessages(domainEvents);
            await waitForMessageConsumer.waitForMessagesToBeConsumed("TestConsumer", ...domainEventIds);

            const account = (await accountFactory.build(accountId))!;

            expect(account).toBeDefined();
            expect(account.getId()).toEqual(accountId);
            expect(account.getOwner()).toEqual(owner);
            expect(account.getBalance()).toEqual(initialAmount - withdrawAmount);
        });
    });
});
