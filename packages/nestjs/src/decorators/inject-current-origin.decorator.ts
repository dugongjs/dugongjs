import { Inject } from "@nestjs/common";
import { CURRENT_ORIGIN_TOKEN } from "../event-issuer/event-issuer.tokens.js";

export const InjectCurrentOrigin = () => Inject(CURRENT_ORIGIN_TOKEN);
