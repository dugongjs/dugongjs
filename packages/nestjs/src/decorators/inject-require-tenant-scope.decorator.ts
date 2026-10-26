import { Inject } from "@nestjs/common";
import { REQUIRE_TENANT_SCOPE_TOKEN } from "../tenancy/tenancy.tokens.js";

export const InjectRequireTenantScope = () => Inject(REQUIRE_TENANT_SCOPE_TOKEN);
