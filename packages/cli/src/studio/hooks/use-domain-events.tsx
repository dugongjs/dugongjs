import type { IAggregateQueryService, TenantScope } from "@dugongjs/core";
import { useQuery } from "@tanstack/react-query";

export function useDomainEvents(
    adapter: IAggregateQueryService | null,
    type: string | null,
    id: string | null,
    tenantScope: TenantScope | undefined
) {
    return useQuery({
        queryKey: ["domainEvents", type, id, tenantScope],
        queryFn: () => adapter!.getDomainEventsForAggregate(null, type!, id!, { tenantScope }),
        enabled: !!adapter && !!type && !!id,
        staleTime: 15_000
    });
}
