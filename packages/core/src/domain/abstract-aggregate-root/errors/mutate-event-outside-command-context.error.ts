export class MutateEventOutsideCommandContextError extends Error {
    constructor() {
        super(
            `Domain events can only be created and staged in the context of a command. Use the @Process() decorator on the method that creates the domain event.`
        );
    }
}
