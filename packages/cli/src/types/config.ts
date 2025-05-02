import type { Context } from "./context.js";

export type Config = {
    currentContext: string;
    contexts: Record<string, Context>;
};
