import type { IAggregateQueryService, TenantScope } from "@dugongjs/core";
import { useQuery } from "@tanstack/react-query";

export function useAggregate(
    adapter: IAggregateQueryService | null,
    type: string | null,
    id: string | null,
    toSequenceNumber: number | null | undefined,
    tenantScope: TenantScope | undefined
) {
    return useQuery({
        queryKey: ["aggregate", type, id, toSequenceNumber ?? "latest", tenantScope],
        queryFn: () =>
            adapter!.getAggregate(null, type!, id!, {
                tenantScope,
                toSequenceNumber: toSequenceNumber ?? undefined
            }),
        enabled: !!adapter && !!type && !!id
    });
}
