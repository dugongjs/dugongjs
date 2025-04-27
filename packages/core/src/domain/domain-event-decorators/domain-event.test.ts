import { domainEventRegistry } from "../domain-event-registry/domain-event-registry.js";
import { DomainEvent } from "./domain-event.js";

vi.mock("../domain-event-registry/domain-event-registry.js", () => ({
    domainEventRegistry: {
        register: vi.fn()
    }
}));

describe("DomainEvent Decorator", () => {
    it("should register the target class in the domainEventRegistry", () => {
        class TestEvent {}

        const decorator = DomainEvent();
        decorator(TestEvent);

        expect(domainEventRegistry.register).toHaveBeenCalledWith(TestEvent);
    });
});
