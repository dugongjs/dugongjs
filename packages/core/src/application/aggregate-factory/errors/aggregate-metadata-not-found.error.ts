export class AggregateMetadataNotFoundError extends Error {
    constructor(className: string) {
        super(
            `Aggregate metadata not found for class: ${className}. Use the '@Aggregate' (or '@ExternalAggregate') decorator to register the aggregate.`
        );
    }
}
