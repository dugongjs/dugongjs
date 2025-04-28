import { Inject } from "@nestjs/common";
import { CURRENT_ORIGIN_TOKEN } from "../tokens.js";

export const InjectCurrentOrigin = () => Inject(CURRENT_ORIGIN_TOKEN);
