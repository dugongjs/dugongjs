import { aggregateMetadataRegistry } from "../aggregate-metadata-registry/aggregate-metadata-registry.js";

export function Aggregate(type: string): ClassDecorator {
    return function (target: any): void {
        aggregateMetadataRegistry.registerAggregateMetadata(target, type);
    };
}
