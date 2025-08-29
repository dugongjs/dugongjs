import type { DomainEventClass } from "@dugongjs/core";

export const ON_DOMAIN_EVENT_TOKEN = "ON_DOMAIN_EVENT_TOKEN" as const;

export const OnDomainEvent =
    (domainEvent: DomainEventClass<any>): MethodDecorator =>
    (target, propertyKey) => {
        const existing: DomainEventClass[] = Reflect.getMetadata(ON_DOMAIN_EVENT_TOKEN, target, propertyKey) ?? [];

        Reflect.defineMetadata(ON_DOMAIN_EVENT_TOKEN, [...existing, domainEvent], target, propertyKey);
    };
