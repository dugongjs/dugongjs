import { IMessageConsumer } from "@dugongjs/core";
import { Inject } from "@nestjs/common";

export const InjectMessageConsumer = () => Inject(IMessageConsumer);
