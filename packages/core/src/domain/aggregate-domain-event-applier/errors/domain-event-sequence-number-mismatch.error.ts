export class DomainEventSequenceNumberMismatchError extends Error {
    constructor(aggregateId: string, expectedSequenceNumber: number, actualSequenceNumber: number) {
        super(
            `Domain event sequence number mismatch for aggregate with ID ${aggregateId}. Expected sequence number: ${expectedSequenceNumber}, actual sequence number: ${actualSequenceNumber}.`
        );
    }
}
