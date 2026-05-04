import { AssertionError } from "./assertion.error.js";

export class MultipleStagedEventsFoundAssertionError extends AssertionError {
    constructor(aggregateName: string, domainEventClassName: string, matchingCount: number) {
        super(
            "multiple-staged-events-found",
            `Expected aggregate ${aggregateName} to have exactly one staged event of type ${domainEventClassName}, but found ${matchingCount}`
        );
        this.name = "MultipleStagedEventsFoundAssertionError";
    }
}
