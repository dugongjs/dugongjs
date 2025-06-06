import { IExternalOriginMap } from "@dugongjs/core";
import { Inject } from "@nestjs/common";

export const InjectExternalOriginMap = () => Inject(IExternalOriginMap);
