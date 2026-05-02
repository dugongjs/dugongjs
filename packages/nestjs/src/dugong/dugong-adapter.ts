import {
    IConsumedMessageRepository,
    IDomainEventRepository,
    IInboundMessageMapper,
    IMessageConsumer,
    IMessageProducer,
    IOutboundMessageMapper,
    ISnapshotRepository,
    ITransactionManager,
    type Constructor
} from "@dugongjs/core";
import type { ModuleMetadata } from "@nestjs/common";

export type DugongAdapters = {
    imports?: ModuleMetadata["imports"];
    providers?: ModuleMetadata["providers"];
    transactionManager?: Constructor<ITransactionManager>;
    domainEventRepository?: Constructor<IDomainEventRepository>;
    snapshotRepository?: Constructor<ISnapshotRepository>;
    consumedMessageRepository?: Constructor<IConsumedMessageRepository>;
    messageConsumer?: Constructor<IMessageConsumer<any>>;
    inboundMessageMapper?: Constructor<IInboundMessageMapper<any>>;
    messageProducer?: Constructor<IMessageProducer<any>>;
    outboundMessageMapper?: Constructor<IOutboundMessageMapper<any>>;
};

export type DugongAdapterFactory = () => DugongAdapters;

export class DugongAdapterBuilder {
    private adapters: DugongAdapters[] = [];

    public static create(): DugongAdapterBuilder {
        return new DugongAdapterBuilder();
    }

    public register(adapter: DugongAdapters | DugongAdapterFactory): this {
        this.adapters.push(typeof adapter === "function" ? adapter() : adapter);
        return this;
    }

    public registerMany(...adapters: (DugongAdapters | DugongAdapterFactory)[]): this {
        adapters.forEach((adapter) => this.register(adapter));
        return this;
    }

    public build(): DugongAdapters {
        const imports = this.adapters.flatMap((adapter) => adapter.imports ?? []);
        const providers = this.adapters.flatMap((adapter) => adapter.providers ?? []);
        const mergedAdapters = this.adapters.reduce<DugongAdapters>((acc, adapter) => {
            if (adapter.transactionManager !== undefined) {
                acc.transactionManager = adapter.transactionManager;
            }
            if (adapter.domainEventRepository !== undefined) {
                acc.domainEventRepository = adapter.domainEventRepository;
            }
            if (adapter.snapshotRepository !== undefined) {
                acc.snapshotRepository = adapter.snapshotRepository;
            }
            if (adapter.consumedMessageRepository !== undefined) {
                acc.consumedMessageRepository = adapter.consumedMessageRepository;
            }
            if (adapter.messageConsumer !== undefined) {
                acc.messageConsumer = adapter.messageConsumer;
            }
            if (adapter.inboundMessageMapper !== undefined) {
                acc.inboundMessageMapper = adapter.inboundMessageMapper;
            }
            if (adapter.messageProducer !== undefined) {
                acc.messageProducer = adapter.messageProducer;
            }
            if (adapter.outboundMessageMapper !== undefined) {
                acc.outboundMessageMapper = adapter.outboundMessageMapper;
            }

            return acc;
        }, {});

        return {
            ...mergedAdapters,
            imports,
            providers
        };
    }
}
