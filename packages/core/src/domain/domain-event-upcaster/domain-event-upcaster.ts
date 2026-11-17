import type { AbstractDomainEvent } from "../abstract-domain-event/abstract-domain-event.js";
import { DomainEventUpcastIdentityMismatchError } from "./errors/domain-event-upcast-identity-mismatch.error.js";
import { DomainEventUpcastVersionMismatchError } from "./errors/domain-event-upcast-version-mismatch.error.js";

class DomainEventUpcaster {
    /**
     * Upcasts a domain event to its latest version by following the chain of `upcast` lifecycle methods.
     * The envelope of the original event is carried over to each upcast event.
     * @param domainEvent The domain event to upcast.
     * @returns The domain event at its latest version, or the event itself if it declares no `upcast` method.
     */
    public upcastDomainEvent(domainEvent: AbstractDomainEvent<any>): AbstractDomainEvent<any> {
        let currentDomainEvent = domainEvent;

        while (currentDomainEvent.upcast) {
            const upcastDomainEvent = currentDomainEvent.upcast();

            this.validateUpcastDomainEvent(currentDomainEvent, upcastDomainEvent);

            currentDomainEvent = this.carryOverEnvelope(currentDomainEvent, upcastDomainEvent);
        }

        return currentDomainEvent;
    }

    private validateUpcastDomainEvent(
        domainEvent: AbstractDomainEvent<any>,
        upcastDomainEvent: AbstractDomainEvent<any>
    ): void {
        const hasSameIdentity =
            upcastDomainEvent.getOrigin() === domainEvent.getOrigin() &&
            upcastDomainEvent.getAggregateType() === domainEvent.getAggregateType() &&
            upcastDomainEvent.getType() === domainEvent.getType();

        if (!hasSameIdentity) {
            throw new DomainEventUpcastIdentityMismatchError(
                domainEvent.getOrigin(),
                domainEvent.getAggregateType(),
                domainEvent.getType(),
                upcastDomainEvent.getOrigin(),
                upcastDomainEvent.getAggregateType(),
                upcastDomainEvent.getType()
            );
        }

        const nextVersion = domainEvent.getVersion() + 1;

        if (upcastDomainEvent.getVersion() !== nextVersion) {
            throw new DomainEventUpcastVersionMismatchError(
                domainEvent.getOrigin(),
                domainEvent.getAggregateType(),
                domainEvent.getType(),
                nextVersion,
                upcastDomainEvent.getVersion()
            );
        }
    }

    private carryOverEnvelope(
        domainEvent: AbstractDomainEvent<any>,
        upcastDomainEvent: AbstractDomainEvent<any>
    ): AbstractDomainEvent<any> {
        return (upcastDomainEvent.constructor as any).deserialize({
            ...domainEvent.serialize(),
            version: upcastDomainEvent.getVersion(),
            payload: upcastDomainEvent.getPayload()
        }) as AbstractDomainEvent<any>;
    }
}

export const domainEventUpcaster = new DomainEventUpcaster();
