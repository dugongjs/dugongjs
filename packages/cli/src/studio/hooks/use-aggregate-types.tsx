import type { IAggregateQueryService } from "@dugongjs/core";
import { useQuery } from "@tanstack/react-query";

export function useAggregateTypes(adapter: IAggregateQueryService | null) {
    return useQuery({
        queryKey: ["aggregateTypes"],
        queryFn: () => adapter!.getAggregateTypes(),
        enabled: !!adapter,
        staleTime: 60_000
    });
}
