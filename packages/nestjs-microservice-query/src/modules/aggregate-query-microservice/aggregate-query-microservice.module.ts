import { AggregateQueryService } from "@dugongjs/nestjs";
import { Module } from "@nestjs/common";
import { AggregateQueryController } from "./aggregate-query.controller.js";

@Module({
    controllers: [AggregateQueryController],
    providers: [AggregateQueryService]
})
export class AggregateQueryMicroserviceModule {}
