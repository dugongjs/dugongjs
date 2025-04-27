import { IsInCreationContext, IsInProcessContext } from "../abstract-aggregate-root/abstract-aggregate-root.js";

export type ProcessOptions = {
    isCreation?: boolean;
};

/**
 * Decorator to mark a method as a process method.
 * @param options Options for the process decorator.
 */
export function Process(options: ProcessOptions = {}): MethodDecorator {
    return function (_target: any, _propertyKey: string | symbol, descriptor: PropertyDescriptor): PropertyDescriptor {
        const originalMethod = descriptor.value;
        const isCreation = options.isCreation ?? false;

        descriptor.value = function (...args: any[]) {
            const self = this as any;
            self[IsInProcessContext] = true;

            if (isCreation) {
                self[IsInCreationContext] = true;
            } else {
                self[IsInCreationContext] = false;
            }

            try {
                return originalMethod.apply(this, args);
            } finally {
                self[IsInProcessContext] = false;
                self[IsInCreationContext] = false;
            }
        };

        return descriptor;
    };
}
