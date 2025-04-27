export class MissingAggregateIdError extends Error {
    constructor() {
        super(`Aggregate ID is missing.`);
    }
}
