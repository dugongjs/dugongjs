import {
    aggregateMetadataRegistry,
    type AggregateSnapshotMetadata
} from "../aggregate-metadata-registry/aggregate-metadata-registry.js";

export function Snapshotable(metadata: AggregateSnapshotMetadata = {}): ClassDecorator {
    return function (target: any): void {
        aggregateMetadataRegistry.registerAggregateSnapshotMetadata(target, metadata);
    };
}
