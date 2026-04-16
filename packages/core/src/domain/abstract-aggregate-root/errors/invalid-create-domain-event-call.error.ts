export class InvalidCreateDomainEventCallError extends Error {
    constructor() {
        super(
            `createDomainEvent was called with a schema-based domain event which requires asynchronous validation. Use createDomainEventAsync instead.`
        );
    }
}
