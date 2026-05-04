import { AssertionError } from "./assertion.error.js";

export class StagedEventsExistAssertionError extends AssertionError {
    constructor(aggregateName: string, stagedDomainEventsDescription: string) {
        super(
            "staged-events-exist",
            `Expected aggregate ${aggregateName} to have no staged events, but found:\n${stagedDomainEventsDescription}`
        );
        this.name = "StagedEventsExistAssertionError";
    }
}
