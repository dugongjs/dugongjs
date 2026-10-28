import {
    aggregateMetadataRegistry,
    type AggregateTenancyMode
} from "../aggregate-metadata-registry/aggregate-metadata-registry.js";

function declareTenancy(mode: AggregateTenancyMode): ClassDecorator {
    return function (target: any): void {
        aggregateMetadataRegistry.registerAggregateTenancyMetadata(target, { mode });
    };
}

export const TenantScoped = {
    Always: (): ClassDecorator => declareTenancy("always"),
    Never: (): ClassDecorator => declareTenancy("never"),
    Optional: (): ClassDecorator => declareTenancy("optional")
};
