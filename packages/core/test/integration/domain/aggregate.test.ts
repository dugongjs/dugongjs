import { faker } from "@faker-js/faker";
import { aggregateDomainEventApplier } from "../../../src/domain/aggregate-domain-event-applier/aggregate-domain-event-applier.js";
import { AggregateIdMismatchError } from "../../../src/domain/aggregate-domain-event-applier/errors/aggregate-id-mismatch.error.js";
import { DomainEventSequenceNumberMismatchError } from "../../../src/domain/aggregate-domain-event-applier/errors/domain-event-sequence-number-mismatch.error.js";
import { aggregateMetadataRegistry } from "../../../src/domain/aggregate-metadata-registry/aggregate-metadata-registry.js";
import { UserAggregate, UserCreatedEvent } from "../use-cases/user.aggregate.js";

describe("Aggregate and Domain Event Integration", () => {
    afterAll(() => {
        aggregateMetadataRegistry.clear();
    });

    it("should handle domain events and apply them to the aggregate", () => {
        const userAggregate = new UserAggregate();
        const username = "test_user";

        userAggregate.createUser(username);

        const stagedDomainEvents = userAggregate.getStagedDomainEvents();

        const userCreatedEvent = stagedDomainEvents[0];

        aggregateDomainEventApplier.applyDomainEventToAggregate(userAggregate, userCreatedEvent);

        expect(userAggregate.getUsername()).toBe(username);
        expect(userAggregate.getStagedDomainEvents()).toContain(userCreatedEvent);
    });

    it("should handle multiple domain events and apply them to the aggregate", () => {
        const userAggregate = new UserAggregate();
        const username1 = "test_user1";
        const username2 = "test_user2";
        userAggregate.createUser(username1);
        userAggregate.updateUser(username2);

        const stagedDomainEvents = userAggregate.getStagedDomainEvents();
        const userCreatedEvent = stagedDomainEvents[0];
        const userUpdatedEvent = stagedDomainEvents[1];

        aggregateDomainEventApplier.applyDomainEventToAggregate(userAggregate, userCreatedEvent);
        aggregateDomainEventApplier.applyDomainEventToAggregate(userAggregate, userUpdatedEvent);

        expect(userAggregate.getUsername()).toBe(username2);
        expect(userAggregate.getStagedDomainEvents()).toContain(userCreatedEvent);
        expect(userAggregate.getStagedDomainEvents()).toContain(userUpdatedEvent);
        expect(userAggregate.getStagedDomainEvents().length).toBe(2);
    });

    it("should throw an error when sequence numbers do not match", () => {
        const userAggregate = new UserAggregate();
        const username = "test_user";

        userAggregate.createUser(username);

        const stagedDomainEvents = userAggregate.getStagedDomainEvents();

        const userCreatedEvent = stagedDomainEvents[0];

        // Simulate a sequence number mismatch
        userCreatedEvent.setSequenceNumber(2);

        expect(() => {
            aggregateDomainEventApplier.applyDomainEventToAggregate(userAggregate, userCreatedEvent);
        }).toThrowError(DomainEventSequenceNumberMismatchError);
    });

    it("should set the ID of the aggregate when rehydrating from a domain event", () => {
        const userId = faker.string.uuid();
        const userAggregate = new UserAggregate();

        const username = "test_user";
        const userCreatedEvent = new UserCreatedEvent(faker.string.uuid(), { username })
            .setAggregateId(userId)
            .setSequenceNumber(1);

        aggregateDomainEventApplier.applyDomainEventToAggregate(userAggregate, userCreatedEvent);

        expect(userAggregate.getId()).toBe(userId);
    });

    it("should throw an error when the aggregate ID does not match the domain event ID", () => {
        const userId = faker.string.uuid();
        const userAggregate = new UserAggregate();
        const username = "test_user";

        const userCreatedEvent = new UserCreatedEvent(faker.string.uuid(), { username })
            .setAggregateId(userId)
            .setSequenceNumber(1);

        userAggregate.setId(faker.string.uuid());

        expect(() => {
            aggregateDomainEventApplier.applyDomainEventToAggregate(userAggregate, userCreatedEvent);
        }).toThrowError(AggregateIdMismatchError);
    });

    it("should call the onCreate lifecycle method of the domain event to allow payload validation", () => {
        const userAggregate = new UserAggregate();

        expect(() => {
            userAggregate.createUser(faker.string.alpha(2));
        }).toThrowErrorMatchingInlineSnapshot(`[Error: Username must be at least 3 characters long.]`);

        expect(() => {
            userAggregate.createUser(faker.string.alpha(21));
        }).toThrowErrorMatchingInlineSnapshot(`[Error: Username must be at most 20 characters long.]`);
    });
});
