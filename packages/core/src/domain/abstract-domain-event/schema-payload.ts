import type { StandardSchemaV1 } from "../../types/standard-schema/v1/standard-schema-v1.js";
import type { DomainEventPayload } from "./abstract-domain-event.js";

export type SchemaPayload<TSchema extends StandardSchemaV1 | null, TInputOrOutput = "INPUT" | "OUTPUT"> =
    TSchema extends StandardSchemaV1<infer TInput, infer TOutput>
        ? TOutput extends DomainEventPayload
            ? TInputOrOutput extends "INPUT"
                ? TInput
                : TOutput
            : never
        : null;
