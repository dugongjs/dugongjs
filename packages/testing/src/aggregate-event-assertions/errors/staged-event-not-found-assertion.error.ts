import { AssertionError } from "./assertion.error.js";

export class StagedEventNotFoundAssertionError extends AssertionError {
    constructor(
        aggregateName: string,
        domainEventClassName: string,
        stagedDomainEventsDescription: string,
        exactMatch: boolean = false
    ) {
        super(
            "staged-event-not-found",
            `Expected aggregate ${aggregateName} to have ${exactMatch ? "exactly one" : "a"} staged event of type ${domainEventClassName}, but found:\n${stagedDomainEventsDescription}`
        );
        this.name = "StagedEventNotFoundAssertionError";
    }
}
