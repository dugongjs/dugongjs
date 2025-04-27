export class AggregateIdSetOutsideCreationContextError extends Error {
    constructor() {
        super(
            `The aggregate ID can only be set during the creation of the aggregate root. Use the @Process({ isCreation: true }) decorator on the command method.`
        );
    }
}
