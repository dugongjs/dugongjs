export class AssertionError extends Error {
    constructor(label: string, message: string) {
        super(`Dugong assertion failed [${label}]: ${message}`);
        this.name = "AssertionError";
    }
}
