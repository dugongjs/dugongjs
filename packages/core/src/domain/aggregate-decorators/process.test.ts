import { IsInCreationContext, IsInProcessContext } from "../abstract-aggregate-root/abstract-aggregate-root.js";
import { Process } from "./process.js";

describe("Process Decorator", () => {
    it("should set IsInProcessContext to true during method execution", () => {
        class TestClass {
            [IsInProcessContext] = false;
            [IsInCreationContext] = false;

            @Process()
            testMethod() {
                expect(this[IsInProcessContext]).toBe(true);
            }
        }

        const instance = new TestClass();
        instance.testMethod();
        expect(instance[IsInProcessContext]).toBe(false);
    });

    it("should set IsInCreationContext to true if isCreation is true", () => {
        class TestClass {
            [IsInProcessContext] = false;
            [IsInCreationContext] = false;

            @Process({ isCreation: true })
            testMethod() {
                expect(this[IsInCreationContext]).toBe(true);
            }
        }

        const instance = new TestClass();
        instance.testMethod();
        expect(instance[IsInCreationContext]).toBe(false);
    });

    it("should set IsInCreationContext to false if isCreation is false", () => {
        class TestClass {
            [IsInProcessContext] = false;
            [IsInCreationContext] = false;

            @Process({ isCreation: false })
            testMethod() {
                expect(this[IsInCreationContext]).toBe(false);
            }
        }

        const instance = new TestClass();
        instance.testMethod();
        expect(instance[IsInCreationContext]).toBe(false);
    });

    it("should call the original method", () => {
        const mockMethod = vi.fn();

        class TestClass {
            [IsInProcessContext] = false;
            [IsInCreationContext] = false;

            @Process()
            testMethod() {
                mockMethod();
            }
        }

        const instance = new TestClass();
        instance.testMethod();
        expect(mockMethod).toHaveBeenCalled();
    });
});
