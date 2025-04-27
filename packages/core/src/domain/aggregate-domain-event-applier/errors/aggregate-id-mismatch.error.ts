export class AggregateIdMismatchError extends Error {
    constructor(expected: string, actual: string) {
        super(`ID of the aggregate root does not match the ID of the event. Expected: ${expected}, actual: ${actual}.`);
    }
}
