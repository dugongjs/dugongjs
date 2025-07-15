import type { Constructor } from "../../types/constructor.type.js";
import type { AbstractDomainEvent } from "../abstract-domain-event/abstract-domain-event.js";
import { aggregateMetadataRegistry } from "../aggregate-metadata-registry/aggregate-metadata-registry.js";

export function Apply(domainEventClass?: Constructor<AbstractDomainEvent<any>>): MethodDecorator {
    return function (target: any, propertyKey: string | symbol): void {
        if (domainEventClass) {
            aggregateMetadataRegistry.registerAggregateDomainEventApplier(
                target.constructor,
                domainEventClass,
                target[propertyKey]
            );

            return;
        }

        aggregateMetadataRegistry.registerDefaultAggregateDomainEventApplier(target.constructor, target[propertyKey]);
    };
}
