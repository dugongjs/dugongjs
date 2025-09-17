import type { IAggregateQueryService } from "@dugongjs/core";
import { useQuery } from "@tanstack/react-query";

export function useAggregateIds(adapter: IAggregateQueryService | null, type: string | null) {
    return useQuery({
        queryKey: ["aggregateIds", type],
        queryFn: () => adapter!.getAggregateIds(null, type!),
        enabled: !!adapter && !!type,
        staleTime: 30_000
    });
}
