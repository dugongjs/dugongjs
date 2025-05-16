import { AggregateFactory, ITransactionManager, WaitForMessageConsumer } from "@dugongjs/core";
import { MessageBuilder } from "@dugongjs/testing";
import { faker } from "@faker-js/faker";
import { OutboundMessageMapperKafkaJS } from "../../../src/adapters/outbound/message-broker/outbound-message-mapper-kafkajs.js";
import { AggregateFactoryTypeOrm } from "../setup/app/aggregate-factory-typeorm.js";
import { AggregateMessageConsumerKafkaJS } from "../setup/app/aggregate-message-consumer-kafkajs.js";
import { AggregateMessageProducerKafkaJS } from "../setup/app/aggregate-message-producer-kafkajs.js";
import { WaitForMessageConsumerKafkaJS } from "../setup/app/wait-for-message-consumer-kafkajs.js";
import { Account } from "./account/account.aggregate.js";
import { AccountClosedEvent } from "./account/domain-events/account-closed.event.js";
import { AccountOpenedEvent } from "./account/domain-events/account-opened.event.js";
import { MoneyDepositedEvent } from "./account/domain-events/monet-deposited.event.js";
import { MoneyWithdrawnEvent } from "./account/domain-events/monet-withdrawn.event.js";

describe("Account", () => {
    let transactionManager: ITransactionManager;
    let accountMessageConsumer: AggregateMessageConsumerKafkaJS<typeof Account>;
    let accountMessageProducer: AggregateMessageProducerKafkaJS<typeof Account>;
    let accountFactory: AggregateFactory<typeof Account>;
    let waitForMessageConsumer: WaitForMessageConsumer;

    const mockHandleMessage = vi.fn();

    beforeAll(async () => {
        accountMessageConsumer = new AggregateMessageConsumerKafkaJS({
            aggregateClass: Account,
            currentOrigin: "TestOrigin"
        });
        accountMessageProducer = new AggregateMessageProducerKafkaJS({
            aggregateClass: Account,
            currentOrigin: "TestOrigin"
        });
        accountFactory = new AggregateFactoryTypeOrm({
            aggregateClass: Account,
            currentOrigin: "TestOrigin"
        });
        waitForMessageConsumer = new WaitForMessageConsumerKafkaJS({
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

    describe("OnAccountOpened", () => {
        it("should open account", async () => {
            const accountId = faker.string.uuid();
            const initialAmount = faker.number.int({ min: 0, max: 1000 });
            const owner = faker.person.fullName();

            const { domainEvents, domainEventIds } = new MessageBuilder({
                outboundMessageMapper: new OutboundMessageMapperKafkaJS()
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

    describe("OnAccountClosed", () => {
        it("should close account", async () => {
            const accountId = faker.string.uuid();
            const initialAmount = faker.number.int({ min: 0, max: 1000 });
            const owner = faker.person.fullName();

            const { domainEvents, domainEventIds } = new MessageBuilder({
                outboundMessageMapper: new OutboundMessageMapperKafkaJS()
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

    describe("OnMoneyDeposited", () => {
        it("should deposit money", async () => {
            const accountId = faker.string.uuid();
            const initialAmount = faker.number.int({ min: 0, max: 1000 });
            const depositAmount = faker.number.int({ min: 1, max: 100 });
            const owner = faker.person.fullName();

            const { domainEvents, domainEventIds } = new MessageBuilder({
                outboundMessageMapper: new OutboundMessageMapperKafkaJS()
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

    describe("OnMoneyWithdrawn", () => {
        it("should withdraw money", async () => {
            const accountId = faker.string.uuid();
            const initialAmount = faker.number.int({ min: 0, max: 1000 });
            const withdrawAmount = faker.number.int({ min: 1, max: 100 });
            const owner = faker.person.fullName();

            const { domainEvents, domainEventIds } = new MessageBuilder({
                outboundMessageMapper: new OutboundMessageMapperKafkaJS()
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
