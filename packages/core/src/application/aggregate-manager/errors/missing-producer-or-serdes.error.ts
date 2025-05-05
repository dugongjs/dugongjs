export class MissingProducerOrSerdesError extends Error {
    constructor() {
        super("Both messageProducer and messageSerdes must be set together or not at all.");
    }
}
