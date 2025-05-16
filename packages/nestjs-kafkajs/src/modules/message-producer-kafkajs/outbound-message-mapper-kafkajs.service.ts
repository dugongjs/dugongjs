import { OutboundMessageMapperKafkaJS } from "@dugongjs/kafkajs";
import { Injectable } from "@nestjs/common";

@Injectable()
export class OutboundMessageMapperKafkaJSService extends OutboundMessageMapperKafkaJS {}
