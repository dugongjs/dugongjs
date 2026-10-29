import type { IAggregateQueryService, TenantScope } from "@dugongjs/core";
import { useQuery } from "@tanstack/react-query";

export function useAggregateIds(
    adapter: IAggregateQueryService | null,
    type: string | null,
    tenantScope: TenantScope | undefined
) {
    return useQuery({
        queryKey: ["aggregateIds", type, tenantScope],
        queryFn: () => adapter!.getAggregateIds(null, type!, { tenantScope }),
        enabled: !!adapter && !!type,
        staleTime: 30_000
    });
}
