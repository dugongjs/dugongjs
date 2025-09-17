import type { IAggregateQueryService } from "@dugongjs/core";
import { useQuery } from "@tanstack/react-query";

export function useAggregate(
    adapter: IAggregateQueryService | null,
    type: string | null,
    id: string | null,
    toSequenceNumber: number | null | undefined
) {
    return useQuery({
        queryKey: ["aggregate", type, id, toSequenceNumber ?? "latest"],
        queryFn: () => adapter!.getAggregate(null, type!, id!, null, toSequenceNumber ?? undefined),
        enabled: !!adapter && !!type && !!id
    });
}
