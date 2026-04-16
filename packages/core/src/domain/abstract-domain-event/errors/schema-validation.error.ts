import type { StandardSchemaV1 } from "../../../types/standard-schema/v1/standard-schema-v1.js";

export class SchemaValidationError extends Error implements StandardSchemaV1.FailureResult {
    issues: readonly StandardSchemaV1.Issue[];

    constructor(issues: readonly StandardSchemaV1.Issue[]) {
        super("Schema validation failed");
        this.issues = issues;
    }
}
