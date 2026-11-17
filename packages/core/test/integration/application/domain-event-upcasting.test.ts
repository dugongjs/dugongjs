import { faker } from "@faker-js/faker";
import { mock, mockReset } from "vitest-mock-extended";
import { InboundMessageMapperInMemory } from "../../../src/adapters/inbound/message-broker/inbound-message-mapper-in-memory.js";
import { MessageConsumerInMemory } from "../../../src/adapters/inbound/message-broker/message-consumer-in-memory.js";
import { MessageProducerInMemory } from "../../../src/adapters/outbound/message-broker/message-producer-in-memory.js";
import { AggregateFactory } from "../../../src/application/aggregate-factory/aggregate-factory.js";
import { AggregateMessageConsumer } from "../../../src/application/aggregate-message-consumer/aggregate-message-consumer.js";
import type { ILogger } from "../../../src/application/logger/i-logger.js";
import type { SerializedDomainEvent } from "../../../src/domain/abstract-domain-event/serialized-domain-event.js";
import { InMemoryMessageBus } from "../../../src/infrastructure/in-memory-message-bus/in-memory-message-bus.js";
import type { IConsumedMessageRepository } from "../../../src/ports/outbound/repository/i-consumed-message-repository.js";
import type { IDomainEventRepository } from "../../../src/ports/outbound/repository/i-domain-event-repository.js";
import type {
    ISnapshotRepository,
    SerializedSnapshot
} from "../../../src/ports/outbound/repository/i-snapshot-repository.js";
import type { ITransactionManager } from "../../../src/ports/outbound/transaction-manager/i-transaction-manager.js";
import { INVOICE_ORIGIN, InvoiceAggregate, InvoiceAmountCorrectedEventV2 } from "../fixtures/invoice.aggregate.js";

describe("domain event upcasting integration behavior", () => {
    let factory: AggregateFactory<typeof InvoiceAggregate>;

    const transactionManager = mock<ITransactionManager>({
        transaction: (fn) => fn({})
    });
    const domainEventRepository = mock<IDomainEventRepository>();
    const snapshotRepository = mock<ISnapshotRepository>();
    const consumedMessageRepository = mock<IConsumedMessageRepository>();
    const logger = mock<ILogger>();

    beforeEach(() => {
        mockReset(domainEventRepository);
        mockReset(snapshotRepository);
        mockReset(consumedMessageRepository);
        mockReset(logger);
        factory = new AggregateFactory({
            aggregateClass: InvoiceAggregate,
            transactionManager,
            domainEventRepository,
            snapshotRepository,
            currentOrigin: INVOICE_ORIGIN,
            logger
        });
    });

    function createSerializedDomainEvent(
        aggregateId: string,
        type: string,
        version: number,
        sequenceNumber: number,
        payload: SerializedDomainEvent["payload"]
    ): SerializedDomainEvent {
        return {
            origin: INVOICE_ORIGIN,
            aggregateType: "Invoice",
            type,
            version,
            id: faker.string.uuid(),
            aggregateId,
            payload,
            sequenceNumber,
            timestamp: faker.date.recent()
        };
    }

    it("should replay an event stored at the oldest version through the latest applier", async () => {
        const invoiceId = faker.string.uuid();

        domainEventRepository.getAggregateDomainEvents.mockResolvedValueOnce([
            createSerializedDomainEvent(invoiceId, "InvoiceIssued", 1, 1, { amount: 100 })
        ]);

        const invoice = await factory.buildFromEventLog(invoiceId);

        expect(invoice?.getAmount()).toBe(100);
        expect(invoice?.getCurrency()).toBe("USD");
        expect(invoice?.getTaxIncluded()).toBe(false);
    });

    it("should enter the upcast chain at the version the event was stored at", async () => {
        const invoiceId = faker.string.uuid();

        domainEventRepository.getAggregateDomainEvents.mockResolvedValueOnce([
            createSerializedDomainEvent(invoiceId, "InvoiceIssued", 2, 1, { amount: 250, currency: "NOK" })
        ]);

        const invoice = await factory.buildFromEventLog(invoiceId);

        expect(invoice?.getAmount()).toBe(250);
        expect(invoice?.getCurrency()).toBe("NOK");
        expect(invoice?.getTaxIncluded()).toBe(false);
    });

    it("should replay an event log that holds events at mixed versions", async () => {
        const invoiceId = faker.string.uuid();

        domainEventRepository.getAggregateDomainEvents.mockResolvedValueOnce([
            createSerializedDomainEvent(invoiceId, "InvoiceIssued", 1, 1, { amount: 100 }),
            createSerializedDomainEvent(invoiceId, "InvoiceSettled", 1, 2, null)
        ]);

        const invoice = await factory.buildFromEventLog(invoiceId);

        expect(invoice?.getAmount()).toBe(100);
        expect(invoice?.getCurrency()).toBe("USD");
        expect(invoice?.isSettled()).toBe(true);
        expect(invoice?.getCurrentDomainEventSequenceNumber()).toBe(2);
    });

    it("should preserve the envelope of the stored event when it is upcast", async () => {
        const invoiceId = faker.string.uuid();

        const serializedDomainEvent = createSerializedDomainEvent(invoiceId, "InvoiceIssued", 1, 1, { amount: 100 });
        domainEventRepository.getAggregateDomainEvents.mockResolvedValueOnce([serializedDomainEvent]);

        const invoice = await factory.buildFromEventLog(invoiceId);

        expect(invoice?.getIssuedByEventId()).toBe(serializedDomainEvent.id);
        expect(invoice?.getCurrentDomainEventSequenceNumber()).toBe(serializedDomainEvent.sequenceNumber);
    });

    it("should upcast events that are replayed on top of a snapshot", async () => {
        const invoiceId = faker.string.uuid();

        const snapshot: SerializedSnapshot = {
            origin: INVOICE_ORIGIN,
            aggregateType: "Invoice",
            aggregateId: invoiceId,
            domainEventSequenceNumber: 1,
            snapshotData: { amount: 100, currency: "USD", taxIncluded: false, settled: false }
        };

        snapshotRepository.getLatestSnapshot.mockResolvedValueOnce(snapshot);
        domainEventRepository.getAggregateDomainEvents.mockResolvedValueOnce([
            createSerializedDomainEvent(invoiceId, "InvoiceAmountCorrected", 1, 2, { amount: 250 })
        ]);

        const invoice = await factory.buildFromLatestSnapshot(invoiceId);

        expect(invoice?.getAmount()).toBe(250);
        expect(invoice?.getCurrency()).toBe("USD");
        expect(invoice?.getCurrentDomainEventSequenceNumber()).toBe(2);
    });

    it("should upcast events that arrive as messages from a message broker", async () => {
        const invoiceId = faker.string.uuid();

        const messageBus = new InMemoryMessageBus<SerializedDomainEvent>();
        const messageProducer = new MessageProducerInMemory(messageBus);
        const messageConsumer = new MessageConsumerInMemory(messageBus);

        const aggregateMessageConsumer = new AggregateMessageConsumer({
            aggregateClass: InvoiceAggregate,
            transactionManager,
            domainEventRepository,
            consumedMessageRepository,
            messageConsumer,
            inboundMessageMapper: new InboundMessageMapperInMemory(),
            currentOrigin: INVOICE_ORIGIN,
            logger
        });

        consumedMessageRepository.checkIfMessageIsConsumed.mockResolvedValue(false);

        const handleMessage = vi.fn();
        await aggregateMessageConsumer.registerMessageConsumerForAggregate("test-consumer", handleMessage);

        const serializedDomainEvent = createSerializedDomainEvent(invoiceId, "InvoiceAmountCorrected", 1, 1, {
            amount: 250
        });

        await messageProducer.publishMessages({}, aggregateMessageConsumer.getMessageChannelId(), [
            serializedDomainEvent
        ]);

        expect(handleMessage).toHaveBeenCalledOnce();

        const { domainEvent, message } = handleMessage.mock.calls[0][0];

        expect(domainEvent).toBeInstanceOf(InvoiceAmountCorrectedEventV2);
        expect(domainEvent.getVersion()).toBe(2);
        expect(domainEvent.getPayload()).toEqual({ amount: 250, currency: "USD" });
        expect(domainEvent.getId()).toBe(serializedDomainEvent.id);
        expect(message).toEqual(serializedDomainEvent);
    });
});
