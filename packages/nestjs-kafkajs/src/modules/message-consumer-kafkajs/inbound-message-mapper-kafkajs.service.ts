import { InboundMessageMapperKafkaJS } from "@dugongjs/kafkajs";
import { Injectable } from "@nestjs/common";

@Injectable()
export class InboundMessageMapperKafkaJSService extends InboundMessageMapperKafkaJS {}
