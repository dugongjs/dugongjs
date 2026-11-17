import { faker } from "@faker-js/faker";
import { AbstractDomainEvent } from "../abstract-domain-event/abstract-domain-event.js";
import { domainEventUpcaster } from "./domain-event-upcaster.js";
import { DomainEventUpcastIdentityMismatchError } from "./errors/domain-event-upcast-identity-mismatch.error.js";
import { DomainEventUpcastVersionMismatchError } from "./errors/domain-event-upcast-version-mismatch.error.js";

type PayloadV1 = { owner: string };
type PayloadV2 = PayloadV1 & { currency: string };
type PayloadV3 = PayloadV2 & { verified: boolean };

class MockDomainEventV3 extends AbstractDomainEvent<PayloadV3> {
    public readonly origin = "MockOrigin";
    public readonly aggregateType = "MockAggregateType";
    public readonly type = "MockDomainEvent";
    public readonly version = 3;
}

class MockDomainEventV2 extends AbstractDomainEvent<PayloadV2> {
    public readonly origin = "MockOrigin";
    public readonly aggregateType = "MockAggregateType";
    public readonly type = "MockDomainEvent";
    public readonly version = 2;

    public upcast(): MockDomainEventV3 {
        return new MockDomainEventV3(this.getAggregateId(), { ...this.getPayload(), verified: false });
    }
}

class MockDomainEventV1 extends AbstractDomainEvent<PayloadV1> {
    public readonly origin = "MockOrigin";
    public readonly aggregateType = "MockAggregateType";
    public readonly type = "MockDomainEvent";
    public readonly version = 1;

    public upcast(): MockDomainEventV2 {
        return new MockDomainEventV2(this.getAggregateId(), { ...this.getPayload(), currency: "USD" });
    }
}

class MockDomainEventWithoutUpcast extends AbstractDomainEvent<PayloadV1> {
    public readonly origin = "MockOrigin";
    public readonly aggregateType = "MockAggregateType";
    public readonly type = "MockDomainEventWithoutUpcast";
    public readonly version = 1;
}

class MockDomainEventWithForeignUpcast extends AbstractDomainEvent<PayloadV1> {
    public readonly origin = "MockOrigin";
    public readonly aggregateType = "MockAggregateType";
    public readonly type = "MockDomainEventWithForeignUpcast";
    public readonly version = 1;

    public upcast(): MockDomainEventV2 {
        return new MockDomainEventV2(this.getAggregateId(), { ...this.getPayload(), currency: "USD" });
    }
}

class MockSkippedVersionDomainEventV3 extends AbstractDomainEvent<PayloadV1> {
    public readonly origin = "MockOrigin";
    public readonly aggregateType = "MockAggregateType";
    public readonly type = "MockSkippedVersionDomainEvent";
    public readonly version = 3;
}

class MockSkippedVersionDomainEventV1 extends AbstractDomainEvent<PayloadV1> {
    public readonly origin = "MockOrigin";
    public readonly aggregateType = "MockAggregateType";
    public readonly type = "MockSkippedVersionDomainEvent";
    public readonly version = 1;

    public upcast(): MockSkippedVersionDomainEventV3 {
        return new MockSkippedVersionDomainEventV3(this.getAggregateId(), this.getPayload());
    }
}

class MockStaleVersionDomainEventV2 extends AbstractDomainEvent<PayloadV1> {
    public readonly origin = "MockOrigin";
    public readonly aggregateType = "MockAggregateType";
    public readonly type = "MockStaleVersionDomainEvent";
    public readonly version = 2;

    public upcast(): AbstractDomainEvent<PayloadV1> {
        const staleDomainEvent = new MockStaleVersionDomainEventV2(this.getAggregateId(), this.getPayload());
        (staleDomainEvent as any).version = 1;
        return staleDomainEvent;
    }
}

describe("DomainEventUpcaster", () => {
    describe("upcastDomainEvent", () => {
        it("should return the domain event itself when it declares no upcast method", () => {
            const domainEvent = new MockDomainEventWithoutUpcast(faker.string.uuid(), {
                owner: faker.person.fullName()
            });

            const upcastDomainEvent = domainEventUpcaster.upcastDomainEvent(domainEvent);

            expect(upcastDomainEvent).toBe(domainEvent);
        });

        it("should upcast a domain event to the next version", () => {
            const owner = faker.person.fullName();
            const domainEvent = new MockDomainEventV2(faker.string.uuid(), { owner, currency: "USD" });

            const upcastDomainEvent = domainEventUpcaster.upcastDomainEvent(domainEvent);

            expect(upcastDomainEvent).toBeInstanceOf(MockDomainEventV3);
            expect(upcastDomainEvent.getVersion()).toBe(3);
            expect(upcastDomainEvent.getPayload()).toEqual({ owner, currency: "USD", verified: false });
        });

        it("should follow the upcast chain through every intermediate version", () => {
            const owner = faker.person.fullName();
            const domainEvent = new MockDomainEventV1(faker.string.uuid(), { owner });

            const upcastDomainEvent = domainEventUpcaster.upcastDomainEvent(domainEvent);

            expect(upcastDomainEvent).toBeInstanceOf(MockDomainEventV3);
            expect(upcastDomainEvent.getVersion()).toBe(3);
            expect(upcastDomainEvent.getPayload()).toEqual({ owner, currency: "USD", verified: false });
        });

        it("should carry the envelope of the original domain event over to the upcast domain event", () => {
            const aggregateId = faker.string.uuid();
            const id = faker.string.uuid();
            const sequenceNumber = faker.number.int({ min: 1, max: 100 });
            const timestamp = faker.date.recent();
            const tenantId = faker.string.uuid();
            const correlationId = faker.string.uuid();
            const triggeredByEventId = faker.string.uuid();
            const triggeredByUserId = faker.string.uuid();
            const metadata = { source: faker.lorem.word() };

            const domainEvent = new MockDomainEventV1(aggregateId, { owner: faker.person.fullName() })
                .setId(id)
                .setSequenceNumber(sequenceNumber)
                .setTimestamp(timestamp)
                .setTenantId(tenantId)
                .setCorrelationId(correlationId)
                .setTriggeredByEventId(triggeredByEventId)
                .setTriggeredByUserId(triggeredByUserId)
                .setMetadata(metadata);

            const upcastDomainEvent = domainEventUpcaster.upcastDomainEvent(domainEvent);

            expect(upcastDomainEvent.getId()).toBe(id);
            expect(upcastDomainEvent.getAggregateId()).toBe(aggregateId);
            expect(upcastDomainEvent.getSequenceNumber()).toBe(sequenceNumber);
            expect(upcastDomainEvent.getTimestamp()).toBe(timestamp);
            expect(upcastDomainEvent.getTenantId()).toBe(tenantId);
            expect(upcastDomainEvent.getCorrelationId()).toBe(correlationId);
            expect(upcastDomainEvent.getTriggeredByEventId()).toBe(triggeredByEventId);
            expect(upcastDomainEvent.getTriggeredByUserId()).toBe(triggeredByUserId);
            expect(upcastDomainEvent.getMetadata()).toEqual(metadata);
        });

        it("should not mutate the domain event it upcasts from", () => {
            const owner = faker.person.fullName();
            const domainEvent = new MockDomainEventV1(faker.string.uuid(), { owner });

            domainEventUpcaster.upcastDomainEvent(domainEvent);

            expect(domainEvent.getVersion()).toBe(1);
            expect(domainEvent.getPayload()).toEqual({ owner });
        });

        it("should throw when the upcast domain event has a different identity", () => {
            const domainEvent = new MockDomainEventWithForeignUpcast(faker.string.uuid(), {
                owner: faker.person.fullName()
            });

            expect(() => {
                domainEventUpcaster.upcastDomainEvent(domainEvent);
            }).toThrowError(DomainEventUpcastIdentityMismatchError);
        });

        it("should throw when the upcast domain event skips a version", () => {
            const domainEvent = new MockSkippedVersionDomainEventV1(faker.string.uuid(), {
                owner: faker.person.fullName()
            });

            expect(() => {
                domainEventUpcaster.upcastDomainEvent(domainEvent);
            }).toThrowError(DomainEventUpcastVersionMismatchError);
        });

        it("should throw when the upcast domain event has an older version", () => {
            const domainEvent = new MockStaleVersionDomainEventV2(faker.string.uuid(), {
                owner: faker.person.fullName()
            });

            expect(() => {
                domainEventUpcaster.upcastDomainEvent(domainEvent);
            }).toThrowError(DomainEventUpcastVersionMismatchError);
        });
    });
});
