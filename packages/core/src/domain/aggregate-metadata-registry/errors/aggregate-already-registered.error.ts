export class AggregateAlreadyRegisteredError extends Error {
    constructor(aggregateName: string) {
        super(`Aggregate '${aggregateName}' is already registered.`);
    }
}
