import { instanceToPlain } from "class-transformer";
import equal from "fast-deep-equal";
import { IsInCreationContext, IsInProcessContext } from "../abstract-aggregate-root/abstract-aggregate-root.js";
import { StateMutatedInProcessContextError } from "../abstract-aggregate-root/errors/state-mutated-in-process-context.error.js";

export type ProcessOptions = {
    /**
     * Allows the method to generate an aggregate ID, which is required when the method creates
     * the aggregate rather than mutating an existing one.
     */
    isCreation?: boolean;
    /**
     * Disables the check that the method leaves aggregate state untouched. Only set this where a
     * direct mutation is deliberate and the lost-on-reconstruction behaviour is understood.
     */
    allowStateMutation?: boolean;
};

const MUTABLE_DURING_PROCESS = ["stagedEvents", "id"];

function captureState(aggregate: object): Record<string, unknown> {
    const state = instanceToPlain(aggregate) as Record<string, unknown>;

    for (const property of MUTABLE_DURING_PROCESS) {
        delete state[property];
    }

    return state;
}

function findMutatedProperties(before: Record<string, unknown>, after: Record<string, unknown>): string[] {
    const properties = new Set([...Object.keys(before), ...Object.keys(after)]);

    return [...properties].filter((property) => !equal(before[property], after[property]));
}

/**
 * Decorator to mark a method as a process method.
 *
 * A process method is where a command is turned into domain events. The decorator opens the
 * process context for the duration of the call, which has two effects:
 *
 * - `createDomainEvent`, `createDomainEventAsync` and `stageDomainEvent` only work inside it, and
 *   throw `MutateEventOutsideCommandContextError` elsewhere. With `isCreation`, the method may
 *   also generate an aggregate ID, which otherwise throws `AggregateIdSetOutsideCreationContextError`.
 * - Aggregate state is compared before and after the call, and
 *   `StateMutatedInProcessContextError` is thrown if the method changed it. State belongs in the
 *   `@Apply()` handlers, because only changes carried by a domain event survive reconstruction of
 *   the aggregate from its event log. Staging events and assigning the aggregate ID are exempt,
 *   and `allowStateMutation` disables the check entirely.
 *
 * Both checks apply to synchronous and asynchronous methods. If the method itself throws, that
 * error propagates untouched and the state comparison is skipped.
 *
 * @param options Options for the process decorator.
 */
export function Process(options: ProcessOptions = {}): MethodDecorator {
    return function (_target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor): PropertyDescriptor {
        const originalMethod = descriptor.value;
        const isCreation = options.isCreation ?? false;
        const allowStateMutation = options.allowStateMutation ?? false;

        descriptor.value = function (...args: any[]) {
            const self = this as any;

            self[IsInProcessContext] = true;
            self[IsInCreationContext] = isCreation;

            const stateBeforeProcess = allowStateMutation ? undefined : captureState(self);

            const resetProcessContext = () => {
                self[IsInProcessContext] = false;
                self[IsInCreationContext] = false;
            };

            const assertStateUnchanged = () => {
                if (!stateBeforeProcess) {
                    return;
                }

                const mutatedProperties = findMutatedProperties(stateBeforeProcess, captureState(self));

                if (mutatedProperties.length > 0) {
                    throw new StateMutatedInProcessContextError(String(propertyKey), mutatedProperties);
                }
            };

            let result: any;

            try {
                result = originalMethod.apply(this, args);
            } catch (error) {
                resetProcessContext();
                throw error;
            }

            if (result instanceof Promise) {
                return result.then(
                    (value) => {
                        resetProcessContext();
                        assertStateUnchanged();

                        return value;
                    },
                    (error) => {
                        resetProcessContext();

                        throw error;
                    }
                );
            }

            resetProcessContext();
            assertStateUnchanged();

            return result;
        };

        return descriptor;
    };
}
