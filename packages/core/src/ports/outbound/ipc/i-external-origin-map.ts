import type { IAggregateQueryService } from "../../common/ipc/i-aggregate-query-service.js";

export type IExternalOriginMap = Map<string, IAggregateQueryService>;

export const IExternalOriginMap = "IExternalOriginMap" as const;
