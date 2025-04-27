import { aggregateMetadataRegistry } from "../aggregate-metadata-registry/aggregate-metadata-registry.js";

export function ExternalAggregate(type: string, origin: string): ClassDecorator {
    return function (target: any): void {
        aggregateMetadataRegistry.registerExternalAggregateMetadata(target, type, origin);
    };
}
