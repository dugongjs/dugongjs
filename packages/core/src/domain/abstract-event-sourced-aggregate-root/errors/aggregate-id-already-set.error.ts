export class AggregateIdAlreadySetError extends Error {
    constructor() {
        super(`Aggregate ID is already set.`);
    }
}
