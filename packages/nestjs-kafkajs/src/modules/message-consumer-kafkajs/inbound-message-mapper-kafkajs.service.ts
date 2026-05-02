import { InboundMessageMapperKafkaJs } from "@dugongjs/kafkajs";
import { Injectable } from "@nestjs/common";

@Injectable()
export class InboundMessageMapperKafkaJsService extends InboundMessageMapperKafkaJs {}
