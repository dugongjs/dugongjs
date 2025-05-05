import { IMessageSerdes } from "@dugongjs/core";
import { Inject } from "@nestjs/common";

export const InjectMessageSerdes = () => Inject(IMessageSerdes);
