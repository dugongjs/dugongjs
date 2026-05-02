import { faker } from "@faker-js/faker";
import { SchemaValidationError } from "../../../src/domain/abstract-domain-event/errors/schema-validation.error.js";
import { aggregateDomainEventApplier } from "../../../src/domain/aggregate-domain-event-applier/aggregate-domain-event-applier.js";
import { aggregateMetadataRegistry } from "../../../src/domain/aggregate-metadata-registry/aggregate-metadata-registry.js";
import {
    OrderAggregate,
    OrderCompletedEvent,
    OrderCreatedEvent,
    OrderItemAddedEvent
} from "../fixtures/order.aggregate.js";

describe("schema-based aggregate behavior", () => {
    afterAll(() => {
        aggregateMetadataRegistry.clear();
    });

    describe("order created event behavior", () => {
        it("should stage an order-created event with date encoded as ISO string", async () => {
            const order = new OrderAggregate();
            const customerId = faker.string.uuid();
            const customerName = faker.person.fullName();
            const createdAt = new Date("2024-01-15T10:30:00.000Z");

            await order.createOrder(customerId, customerName, createdAt);

            const stagedEvents = order.getStagedDomainEvents();
            expect(stagedEvents).toHaveLength(1);

            const event = stagedEvents[0] as OrderCreatedEvent;
            const payload = event.getPayload();

            // Date should be transformed to ISO string
            expect(payload.createdAt).toBe("2024-01-15T10:30:00.000Z");
            expect(payload.customerId).toBe(customerId);
            expect(payload.customerName).toBe(customerName);
        });

        it("should apply order-created events to aggregate state", async () => {
            const order = new OrderAggregate();
            const customerId = faker.string.uuid();
            const customerName = faker.person.fullName();
            const createdAt = new Date();

            await order.createOrder(customerId, customerName, createdAt);

            const event = order.getStagedDomainEvents()[0];
            aggregateDomainEventApplier.applyDomainEventToAggregate(order, event);

            expect(order.getCustomerId()).toBe(customerId);
            expect(order.getCustomerName()).toBe(customerName);
            expect(order.getCreatedAt()).toBe(createdAt.toISOString());
        });

        it("should reject invalid customer id values", async () => {
            const order = new OrderAggregate();

            await expect(order.createOrder("not-a-uuid", faker.person.fullName(), new Date())).rejects.toThrow(
                SchemaValidationError
            );
        });

        it("should reject empty customer names", async () => {
            const order = new OrderAggregate();

            await expect(order.createOrder(faker.string.uuid(), "", new Date())).rejects.toThrow(SchemaValidationError);
        });
    });

    describe("order item added event behavior", () => {
        it("should stage line-item events for valid item input", async () => {
            const order = new OrderAggregate();
            await order.createOrder(faker.string.uuid(), faker.person.fullName(), new Date());

            const event = order.getStagedDomainEvents()[0];
            aggregateDomainEventApplier.applyDomainEventToAggregate(order, event);

            const productId = faker.string.uuid();
            const productName = "Widget";
            const quantity = 5;
            const unitPrice = 10.99;

            await order.addLineItem(productId, productName, quantity, unitPrice);

            const itemEvent = order.getStagedDomainEvents()[1] as OrderItemAddedEvent;
            const payload = itemEvent.getPayload();

            expect(payload.productId).toBe(productId);
            expect(payload.productName).toBe(productName);
            expect(payload.quantity).toBe(quantity);
            expect(payload.unitPrice).toBe(unitPrice);
        });

        it("should calculate line totals during event lifecycle hooks", async () => {
            const order = new OrderAggregate();
            await order.createOrder(faker.string.uuid(), faker.person.fullName(), new Date());

            const createEvent = order.getStagedDomainEvents()[0];
            aggregateDomainEventApplier.applyDomainEventToAggregate(order, createEvent);

            await order.addLineItem(faker.string.uuid(), "Widget", 5, 10.0);

            const itemEvent = order.getStagedDomainEvents()[1] as OrderItemAddedEvent;
            expect(itemEvent.getLineTotal()).toBe(50.0);
        });

        it("should apply line-item events to the aggregate list", async () => {
            const order = new OrderAggregate();
            await order.createOrder(faker.string.uuid(), faker.person.fullName(), new Date());

            const createEvent = order.getStagedDomainEvents()[0];
            aggregateDomainEventApplier.applyDomainEventToAggregate(order, createEvent);

            await order.addLineItem(faker.string.uuid(), "Widget A", 2, 15.0);
            await order.addLineItem(faker.string.uuid(), "Widget B", 3, 20.0);

            const itemEvent1 = order.getStagedDomainEvents()[1];
            const itemEvent2 = order.getStagedDomainEvents()[2];

            aggregateDomainEventApplier.applyDomainEventToAggregate(order, itemEvent1);
            aggregateDomainEventApplier.applyDomainEventToAggregate(order, itemEvent2);

            const lineItems = order.getLineItems();
            expect(lineItems).toHaveLength(2);
            expect(lineItems[0].productName).toBe("Widget A");
            expect(lineItems[1].productName).toBe("Widget B");
        });

        it("should reject non-positive line-item quantities", async () => {
            const order = new OrderAggregate();
            await order.createOrder(faker.string.uuid(), faker.person.fullName(), new Date());

            const createEvent = order.getStagedDomainEvents()[0];
            aggregateDomainEventApplier.applyDomainEventToAggregate(order, createEvent);

            // quantity must be >= 1
            await expect(order.addLineItem(faker.string.uuid(), "Widget", 0, 10.0)).rejects.toThrow(
                SchemaValidationError
            );
        });

        it("should reject negative line-item prices", async () => {
            const order = new OrderAggregate();
            await order.createOrder(faker.string.uuid(), faker.person.fullName(), new Date());

            const createEvent = order.getStagedDomainEvents()[0];
            aggregateDomainEventApplier.applyDomainEventToAggregate(order, createEvent);

            await expect(order.addLineItem(faker.string.uuid(), "Widget", 1, -5.0)).rejects.toThrow(
                SchemaValidationError
            );
        });
    });

    describe("order completed event behavior", () => {
        it("should stage completion events with computed total amount", async () => {
            const order = new OrderAggregate();
            await order.createOrder(faker.string.uuid(), faker.person.fullName(), new Date());

            const createEvent = order.getStagedDomainEvents()[0];
            aggregateDomainEventApplier.applyDomainEventToAggregate(order, createEvent);

            await order.addLineItem(faker.string.uuid(), "Widget A", 2, 10.0);
            await order.addLineItem(faker.string.uuid(), "Widget B", 3, 15.0);

            const itemEvent1 = order.getStagedDomainEvents()[1];
            const itemEvent2 = order.getStagedDomainEvents()[2];
            aggregateDomainEventApplier.applyDomainEventToAggregate(order, itemEvent1);
            aggregateDomainEventApplier.applyDomainEventToAggregate(order, itemEvent2);

            const completedAt = new Date("2024-01-16T15:00:00.000Z");
            await order.completeOrder(completedAt);

            const completeEvent = order.getStagedDomainEvents()[3] as OrderCompletedEvent;
            const payload = completeEvent.getPayload();

            expect(payload.completedAt).toBe("2024-01-16T15:00:00.000Z");
            expect(payload.totalAmount).toBe(65.0); // (2 * 10) + (3 * 15)
        });

        it("should apply completion events to mark aggregate as completed", async () => {
            const order = new OrderAggregate();
            await order.createOrder(faker.string.uuid(), faker.person.fullName(), new Date());

            const createEvent = order.getStagedDomainEvents()[0];
            aggregateDomainEventApplier.applyDomainEventToAggregate(order, createEvent);

            await order.addLineItem(faker.string.uuid(), "Widget", 2, 25.0);
            const itemEvent = order.getStagedDomainEvents()[1];
            aggregateDomainEventApplier.applyDomainEventToAggregate(order, itemEvent);

            const completedAt = new Date();
            await order.completeOrder(completedAt);

            const completeEvent = order.getStagedDomainEvents()[2];
            aggregateDomainEventApplier.applyDomainEventToAggregate(order, completeEvent);

            expect(order.getStatus()).toBe("completed");
            expect(order.getCompletedAt()).toBe(completedAt.toISOString());
            expect(order.getTotalAmount()).toBe(50.0);
        });
    });

    describe("mixed event behavior", () => {
        it("should support schema and non-schema events in one aggregate stream", async () => {
            const order = new OrderAggregate();
            await order.createOrder(faker.string.uuid(), faker.person.fullName(), new Date());

            const createEvent = order.getStagedDomainEvents()[0];
            aggregateDomainEventApplier.applyDomainEventToAggregate(order, createEvent);

            // Cancel using non-schema-based event
            order.cancelOrder("Customer changed their mind");

            const cancelEvent = order.getStagedDomainEvents()[1];
            aggregateDomainEventApplier.applyDomainEventToAggregate(order, cancelEvent);

            expect(order.getStatus()).toBe("cancelled");
        });
    });

    describe("schema event serialization behavior", () => {
        it("should round-trip order-created events through serialization", async () => {
            const order = new OrderAggregate();
            const customerId = faker.string.uuid();
            const customerName = faker.person.fullName();
            const createdAt = new Date("2024-01-15T10:30:00.000Z");

            await order.createOrder(customerId, customerName, createdAt);

            const originalEvent = order.getStagedDomainEvents()[0] as OrderCreatedEvent;
            originalEvent.setId(faker.string.uuid());
            originalEvent.setSequenceNumber(1);
            originalEvent.setTimestamp(new Date());

            const serialized = originalEvent.serialize();
            const deserialized = OrderCreatedEvent.deserialize(serialized);

            expect(deserialized).toBeInstanceOf(OrderCreatedEvent);
            expect(deserialized.getPayload()).toEqual(originalEvent.getPayload());
            expect(deserialized.getId()).toBe(originalEvent.getId());
            expect(deserialized.getAggregateId()).toBe(originalEvent.getAggregateId());
        });

        it("should preserve transformed payload values after round-trip serialization", async () => {
            const order = new OrderAggregate();
            const createdAt = new Date("2024-06-20T08:00:00.000Z");

            await order.createOrder(faker.string.uuid(), faker.person.fullName(), createdAt);

            const originalEvent = order.getStagedDomainEvents()[0] as OrderCreatedEvent;
            originalEvent.setId(faker.string.uuid());
            originalEvent.setSequenceNumber(1);
            originalEvent.setTimestamp(new Date());

            const serialized = originalEvent.serialize();
            const deserialized = OrderCreatedEvent.deserialize(serialized);

            // The date should still be an ISO string after deserialization
            expect(deserialized.getPayload().createdAt).toBe("2024-06-20T08:00:00.000Z");
        });
    });

    describe("schema event metadata behavior", () => {
        it("should expose expected static event metadata", () => {
            expect(OrderCreatedEvent.origin).toBe("Sales.OrderService");
            expect(OrderCreatedEvent.aggregateType).toBe("Order");
            expect(OrderCreatedEvent.type).toBe("OrderCreated");
            expect(OrderCreatedEvent.version).toBe(1);
        });
    });

    describe("full order lifecycle behavior", () => {
        it("should process create, line items, and completion with schema validation", async () => {
            const order = new OrderAggregate();
            const customerId = faker.string.uuid();
            const customerName = faker.person.fullName();
            const orderDate = new Date("2024-01-15T09:00:00.000Z");

            // Create order
            await order.createOrder(customerId, customerName, orderDate);
            aggregateDomainEventApplier.applyDomainEventToAggregate(order, order.getStagedDomainEvents()[0]);

            expect(order.getCustomerId()).toBe(customerId);
            expect(order.getStatus()).toBe("pending");

            // Add items
            await order.addLineItem(faker.string.uuid(), "Laptop", 1, 999.99);
            await order.addLineItem(faker.string.uuid(), "Mouse", 2, 29.99);
            await order.addLineItem(faker.string.uuid(), "Keyboard", 1, 79.99);

            aggregateDomainEventApplier.applyDomainEventToAggregate(order, order.getStagedDomainEvents()[1]);
            aggregateDomainEventApplier.applyDomainEventToAggregate(order, order.getStagedDomainEvents()[2]);
            aggregateDomainEventApplier.applyDomainEventToAggregate(order, order.getStagedDomainEvents()[3]);

            expect(order.getLineItems()).toHaveLength(3);

            // Complete order
            const completionDate = new Date("2024-01-15T14:30:00.000Z");
            await order.completeOrder(completionDate);

            aggregateDomainEventApplier.applyDomainEventToAggregate(order, order.getStagedDomainEvents()[4]);

            expect(order.getStatus()).toBe("completed");
            expect(order.getCompletedAt()).toBe("2024-01-15T14:30:00.000Z");
            // Total: 999.99 + (2 * 29.99) + 79.99 = 1139.96
            expect(order.getTotalAmount()).toBeCloseTo(1139.96, 2);
        });
    });
});
