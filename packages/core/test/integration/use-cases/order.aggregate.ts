import { z } from "zod";
import { AbstractAggregateRoot } from "../../../src/domain/abstract-aggregate-root/abstract-aggregate-root.js";
import {
    AbstractDomainEvent,
    type DomainEventPayload
} from "../../../src/domain/abstract-domain-event/abstract-domain-event.js";
import { Aggregate } from "../../../src/domain/aggregate-decorators/aggregate.js";
import { Apply } from "../../../src/domain/aggregate-decorators/apply.js";
import { Process } from "../../../src/domain/aggregate-decorators/process.js";
import { DomainEvent } from "../../../src/domain/domain-event-decorators/domain-event.js";

// Codec to transform Date to ISO string for serialization
const dateToIsoString = z.codec(z.date(), z.iso.datetime(), {
    encode: (isoString) => new Date(isoString),
    decode: (date) => date.toISOString()
});

// Schemas for domain events
const orderCreatedSchema = z.object({
    customerId: z.string().uuid(),
    customerName: z.string().min(1),
    createdAt: dateToIsoString
});

const orderItemAddedSchema = z.object({
    productId: z.string().uuid(),
    productName: z.string().min(1),
    quantity: z.number().int().min(1),
    unitPrice: z.number().min(0)
});

const orderCompletedSchema = z.object({
    completedAt: dateToIsoString,
    totalAmount: z.number().min(0)
});

// Base class for Order domain events using schema
abstract class AbstractOrderDomainEvent<
    TPayload extends DomainEventPayload = null
> extends AbstractDomainEvent<TPayload> {
    public readonly origin = "Sales.OrderService";
    public readonly aggregateType = "Order";
}

// Schema-based domain events
@DomainEvent()
export class OrderCreatedEvent extends AbstractDomainEvent.fromSchema(orderCreatedSchema) {
    public readonly origin = "Sales.OrderService";
    public readonly aggregateType = "Order";
    public readonly type = "OrderCreated";
    public readonly version = 1;
}

@DomainEvent()
export class OrderItemAddedEvent extends AbstractDomainEvent.fromSchema(orderItemAddedSchema) {
    public readonly origin = "Sales.OrderService";
    public readonly aggregateType = "Order";
    public readonly type = "OrderItemAdded";
    public readonly version = 1;

    private calculatedLineTotal: number;

    public onCreate(): void {
        const payload = this.getPayload();
        this.calculatedLineTotal = payload.quantity * payload.unitPrice;
    }

    public getLineTotal(): number {
        return this.calculatedLineTotal;
    }
}

@DomainEvent()
export class OrderCompletedEvent extends AbstractDomainEvent.fromSchema(orderCompletedSchema) {
    public readonly origin = "Sales.OrderService";
    public readonly aggregateType = "Order";
    public readonly type = "OrderCompleted";
    public readonly version = 1;
}

// Non-schema based event for comparison
@DomainEvent()
export class OrderCancelledEvent extends AbstractOrderDomainEvent<{ reason: string }> {
    public readonly type = "OrderCancelled";
    public readonly version = 1;

    constructor(aggregateId: string, payload: { reason: string }) {
        super(aggregateId, payload);
    }
}

// Order line item type
interface OrderLineItem {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
}

// Order aggregate
@Aggregate("Order")
export class OrderAggregate extends AbstractAggregateRoot {
    private customerId: string | null = null;
    private customerName: string | null = null;
    private createdAt: string | null = null;
    private lineItems: OrderLineItem[] = [];
    private status: "pending" | "completed" | "cancelled" = "pending";
    private completedAt: string | null = null;
    private totalAmount: number = 0;

    public getCustomerId(): string | null {
        return this.customerId;
    }

    public getCustomerName(): string | null {
        return this.customerName;
    }

    public getCreatedAt(): string | null {
        return this.createdAt;
    }

    public getLineItems(): OrderLineItem[] {
        return [...this.lineItems];
    }

    public getStatus(): string {
        return this.status;
    }

    public getCompletedAt(): string | null {
        return this.completedAt;
    }

    public getTotalAmount(): number {
        return this.totalAmount;
    }

    @Process({ isCreation: true })
    public async createOrder(customerId: string, customerName: string, createdAt: Date): Promise<void> {
        const event = await this.createDomainEventAsync(OrderCreatedEvent, {
            customerId,
            customerName,
            createdAt
        });
        this.stageDomainEvent(event);
    }

    @Process()
    public async addLineItem(
        productId: string,
        productName: string,
        quantity: number,
        unitPrice: number
    ): Promise<void> {
        const event = await this.createDomainEventAsync(OrderItemAddedEvent, {
            productId,
            productName,
            quantity,
            unitPrice
        });
        this.stageDomainEvent(event);
    }

    @Process()
    public async completeOrder(completedAt: Date): Promise<void> {
        const totalAmount = this.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
        const event = await this.createDomainEventAsync(OrderCompletedEvent, {
            completedAt,
            totalAmount
        });
        this.stageDomainEvent(event);
    }

    @Process()
    public cancelOrder(reason: string): void {
        const event = this.createDomainEvent(OrderCancelledEvent, { reason });
        this.stageDomainEvent(event);
    }

    @Apply(OrderCreatedEvent)
    public applyOrderCreated(event: OrderCreatedEvent): void {
        const payload = event.getPayload();
        this.customerId = payload.customerId;
        this.customerName = payload.customerName;
        this.createdAt = payload.createdAt;
    }

    @Apply(OrderItemAddedEvent)
    public applyOrderItemAdded(event: OrderItemAddedEvent): void {
        const payload = event.getPayload();
        this.lineItems.push({
            productId: payload.productId,
            productName: payload.productName,
            quantity: payload.quantity,
            unitPrice: payload.unitPrice
        });
    }

    @Apply(OrderCompletedEvent)
    public applyOrderCompleted(event: OrderCompletedEvent): void {
        const payload = event.getPayload();
        this.status = "completed";
        this.completedAt = payload.completedAt;
        this.totalAmount = payload.totalAmount;
    }

    @Apply(OrderCancelledEvent)
    public applyOrderCancelled(): void {
        this.status = "cancelled";
    }
}
