/**
 * Determines the tenant scoping for the context.
 */
export type TenantScope =
    | {
          readonly type: "tenant";
          readonly tenantId: string;
      }
    | {
          readonly type: "unscoped";
      };
