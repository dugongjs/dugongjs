export {
    AssertionError,
    assertNoStagedEvents,
    assertSingleStagedEvent,
    assertStagedEvent,
    assertStagedEventCount,
    findStagedEvents,
    MultipleStagedEventsFoundAssertionError,
    StagedEventCountMismatchAssertionError,
    StagedEventNotFoundAssertionError,
    StagedEventsExistAssertionError
} from "./aggregate-event-assertions/index.js";
export { MessageBuilder, type BuildResult, type MessageBuilderOptions } from "./message-builder/message-builder.js";
