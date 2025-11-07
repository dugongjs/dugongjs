import type { SerializableObject } from "./serializable-object.type.js";

describe("SerializableObject", () => {
    it("should allow primitive values", () => {
        const obj = {
            name: "Test",
            age: 30,
            isActive: true
        };

        assertType<SerializableObject>(obj);
    });

    it("should allow arrays of primitive values", () => {
        const obj = {
            names: ["Alice", "Bob", "Charlie"],
            scores: [10, 20, 30],
            flags: [true, false, true]
        };

        assertType<SerializableObject>(obj);
    });

    it("should allow nested serializable objects", () => {
        const obj = {
            user: {
                name: "Test",
                details: {
                    age: 30,
                    isActive: true
                }
            }
        };

        assertType<SerializableObject>(obj);
    });

    it("should allow arrays of serializable objects", () => {
        const obj = {
            users: [
                { name: "Alice", age: 25 },
                { name: "Bob", age: 30 }
            ]
        };

        assertType<SerializableObject>(obj);
    });

    it("should not allow non-serializable values", () => {
        const obj = {
            name: "Test",
            date: new Date(),
            func: () => {}
        };

        // @ts-expect-error: 'date' and 'func' are not serializable
        assertType<SerializableObject>(obj);
    });
});
