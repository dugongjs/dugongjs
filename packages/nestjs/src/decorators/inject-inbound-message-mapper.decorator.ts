import { IInboundMessageMapper } from "@dugongjs/core";
import { Inject } from "@nestjs/common";

export const InjectInboundMessageMapper = () => Inject(IInboundMessageMapper);
