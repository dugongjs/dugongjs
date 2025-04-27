export class DomainEventAlreadyRegisteredError extends Error {
    constructor(origin: string, aggregateType: string, type: string, version: number) {
        super(`Domain event already registered: ${origin} - ${aggregateType} - ${type} - ${version}`);
    }
}
