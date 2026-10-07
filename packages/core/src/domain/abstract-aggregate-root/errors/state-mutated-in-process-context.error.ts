export class StateMutatedInProcessContextError extends Error {
    constructor(methodName: string, mutatedProperties: string[]) {
        super(
            `Aggregate state was mutated directly in the @Process() method "${methodName}" (${mutatedProperties.join(", ")}). ` +
                `Process methods must only create and stage domain events; state is applied by the corresponding @Apply() handlers. ` +
                `Direct mutations are not recorded in the event log and do not survive reconstruction of the aggregate. ` +
                `Use @Process({ allowStateMutation: true }) if the mutation is intentional.`
        );
    }
}
