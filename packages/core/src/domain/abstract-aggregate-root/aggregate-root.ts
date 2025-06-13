import type { RemoveAbstract } from "../../types/remove-abstract.type.js";
import type { AbstractAggregateRoot } from "./abstract-aggregate-root.js";

export type AggregateRoot = RemoveAbstract<typeof AbstractAggregateRoot>;
