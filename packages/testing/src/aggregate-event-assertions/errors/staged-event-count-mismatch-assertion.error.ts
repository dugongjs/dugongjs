import { AssertionError } from "./assertion.error.js";

export class StagedEventCountMismatchAssertionError extends AssertionError {
    constructor(
        aggregateName: string,
        expectedCount: number,
        actualCount: number,
        stagedDomainEventsDescription: string
    ) {
        super(
            "staged-event-count-mismatch",
            `Expected aggregate ${aggregateName} to have ${expectedCount} staged event(s), but found ${actualCount}:\n${stagedDomainEventsDescription}`
        );
        this.name = "StagedEventCountMismatchAssertionError";
    }
}
