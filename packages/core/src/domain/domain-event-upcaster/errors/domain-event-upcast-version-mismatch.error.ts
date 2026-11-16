export class DomainEventUpcastVersionMismatchError extends Error {
    constructor(origin: string, aggregateType: string, type: string, expected: number, actual: number) {
        super(
            `Upcast domain event must have the version that follows the event it was upcast from. Event: ${origin} - ${aggregateType} - ${type}, expected: ${expected}, actual: ${actual}.`
        );
    }
}
