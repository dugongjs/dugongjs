import { IOutboundMessageMapper } from "@dugongjs/core";
import { Inject } from "@nestjs/common";

export const InjectOutboundMessageMapper = () => Inject(IOutboundMessageMapper);
