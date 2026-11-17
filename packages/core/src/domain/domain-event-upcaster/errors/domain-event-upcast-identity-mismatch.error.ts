export class DomainEventUpcastIdentityMismatchError extends Error {
    constructor(
        origin: string,
        aggregateType: string,
        type: string,
        upcastOrigin: string,
        upcastAggregateType: string,
        upcastType: string
    ) {
        super(
            `Upcast domain event must have the same identity as the event it was upcast from. Expected: ${origin} - ${aggregateType} - ${type}, actual: ${upcastOrigin} - ${upcastAggregateType} - ${upcastType}.`
        );
    }
}
