import type { RemoveAbstract } from "../../types/remove-abstract.type.js";
import type { AbstractEventSourcedAggregateRoot } from "./abstract-event-sourced-aggregate-root.js";

export type EventSourcedAggregateRoot = RemoveAbstract<typeof AbstractEventSourcedAggregateRoot>;
