import { AbstractAggregateRoot } from "../../../src/domain/abstract-aggregate-root/abstract-aggregate-root.js";
import {
    AbstractDomainEvent,
    type DomainEventPayload
} from "../../../src/domain/abstract-domain-event/abstract-domain-event.js";
import { Aggregate } from "../../../src/domain/aggregate-decorators/aggregate.js";
import { Apply } from "../../../src/domain/aggregate-decorators/apply.js";
import { Process } from "../../../src/domain/aggregate-decorators/process.js";
import { DomainEvent } from "../../../src/domain/domain-event-decorators/domain-event.js";

export const INVOICE_ORIGIN = "Billing.InvoiceService";

abstract class AbstractInvoiceDomainEvent<
    TPayload extends DomainEventPayload = null
> extends AbstractDomainEvent<TPayload> {
    public readonly origin = INVOICE_ORIGIN;
    public readonly aggregateType = "Invoice";
}

export type InvoiceIssuedPayloadV1 = { amount: number };
export type InvoiceIssuedPayloadV2 = InvoiceIssuedPayloadV1 & { currency: string };
export type InvoiceIssuedPayloadV3 = InvoiceIssuedPayloadV2 & { taxIncluded: boolean };

@DomainEvent()
export class InvoiceIssuedEventV3 extends AbstractInvoiceDomainEvent<InvoiceIssuedPayloadV3> {
    public readonly type = "InvoiceIssued";
    public readonly version = 3;
}

@DomainEvent()
export class InvoiceIssuedEventV2 extends AbstractInvoiceDomainEvent<InvoiceIssuedPayloadV2> {
    public readonly type = "InvoiceIssued";
    public readonly version = 2;

    public upcast(): InvoiceIssuedEventV3 {
        return new InvoiceIssuedEventV3(this.getAggregateId(), { ...this.getPayload(), taxIncluded: false });
    }
}

@DomainEvent()
export class InvoiceIssuedEventV1 extends AbstractInvoiceDomainEvent<InvoiceIssuedPayloadV1> {
    public readonly type = "InvoiceIssued";
    public readonly version = 1;

    public upcast(): InvoiceIssuedEventV2 {
        return new InvoiceIssuedEventV2(this.getAggregateId(), { ...this.getPayload(), currency: "USD" });
    }
}

@DomainEvent()
export class InvoiceSettledEvent extends AbstractInvoiceDomainEvent {
    public readonly type = "InvoiceSettled";
    public readonly version = 1;
}

export type InvoiceAmountCorrectedPayloadV1 = { amount: number };
export type InvoiceAmountCorrectedPayloadV2 = InvoiceAmountCorrectedPayloadV1 & { currency: string };

@DomainEvent()
export class InvoiceAmountCorrectedEventV2 extends AbstractInvoiceDomainEvent<InvoiceAmountCorrectedPayloadV2> {
    public readonly type = "InvoiceAmountCorrected";
    public readonly version = 2;
}

@DomainEvent()
export class InvoiceAmountCorrectedEventV1 extends AbstractInvoiceDomainEvent<InvoiceAmountCorrectedPayloadV1> {
    public readonly type = "InvoiceAmountCorrected";
    public readonly version = 1;

    public upcast(): InvoiceAmountCorrectedEventV2 {
        return new InvoiceAmountCorrectedEventV2(this.getAggregateId(), { ...this.getPayload(), currency: "USD" });
    }
}

@Aggregate("Invoice")
export class InvoiceAggregate extends AbstractAggregateRoot {
    private amount: number | null = null;
    private currency: string | null = null;
    private taxIncluded: boolean | null = null;
    private settled = false;
    private issuedByEventId: string | null = null;

    public getAmount(): number | null {
        return this.amount;
    }

    public getCurrency(): string | null {
        return this.currency;
    }

    public getTaxIncluded(): boolean | null {
        return this.taxIncluded;
    }

    public isSettled(): boolean {
        return this.settled;
    }

    public getIssuedByEventId(): string | null {
        return this.issuedByEventId;
    }

    @Process({ isCreation: true })
    public issueInvoice(payload: InvoiceIssuedPayloadV3): void {
        this.stageDomainEvent(this.createDomainEvent(InvoiceIssuedEventV3, payload));
    }

    @Process()
    public settleInvoice(): void {
        this.stageDomainEvent(this.createDomainEvent(InvoiceSettledEvent));
    }

    @Process()
    public correctInvoiceAmount(payload: InvoiceAmountCorrectedPayloadV2): void {
        this.stageDomainEvent(this.createDomainEvent(InvoiceAmountCorrectedEventV2, payload));
    }

    @Apply(InvoiceIssuedEventV3)
    public applyInvoiceIssued(event: InvoiceIssuedEventV3): void {
        const payload = event.getPayload();
        this.amount = payload.amount;
        this.currency = payload.currency;
        this.taxIncluded = payload.taxIncluded;
        this.issuedByEventId = event.getId();
    }

    @Apply(InvoiceSettledEvent)
    public applyInvoiceSettled(): void {
        this.settled = true;
    }

    @Apply(InvoiceAmountCorrectedEventV2)
    public applyInvoiceAmountCorrected(event: InvoiceAmountCorrectedEventV2): void {
        const payload = event.getPayload();
        this.amount = payload.amount;
        this.currency = payload.currency;
    }
}
