export class AggregateManagerNotAvailableError extends Error {
    constructor() {
        super("AggregateManager is only available for classes that extend AbstractAggregateRoot.");
    }
}
