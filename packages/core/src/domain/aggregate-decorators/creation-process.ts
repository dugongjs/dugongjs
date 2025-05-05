import { Process } from "./process.js";

export function CreationProcess(): MethodDecorator {
    return Process({ isCreation: true });
}
