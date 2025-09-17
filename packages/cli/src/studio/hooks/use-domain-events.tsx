import type { IAggregateQueryService } from "@dugongjs/core";
import { useQuery } from "@tanstack/react-query";

export function useDomainEvents(adapter: IAggregateQueryService | null, type: string | null, id: string | null) {
    return useQuery({
        queryKey: ["domainEvents", type, id],
        queryFn: () => adapter!.getDomainEventsForAggregate(null, type!, id!),
        enabled: !!adapter && !!type && !!id,
        staleTime: 15_000
    });
}
