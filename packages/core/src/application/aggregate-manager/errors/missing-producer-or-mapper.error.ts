export class MissingProducerOrMapperError extends Error {
    constructor() {
        super("Both messageProducer and outboundMessageMapper must be set together or not at all.");
    }
}
