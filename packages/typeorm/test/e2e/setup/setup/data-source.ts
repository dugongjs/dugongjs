import { DataSource, type DataSourceOptions } from "typeorm";
import { ConsumedMessageEntity } from "../../../../src/infrastructure/db/entities/consumed-message.js";
import { DomainEventEntity } from "../../../../src/infrastructure/db/entities/domain-event.entity.js";
import { OutboxEntity } from "../../../../src/infrastructure/db/entities/outbox-entity.js";
import { SnapshotEntity } from "../../../../src/infrastructure/db/entities/snapshot.entity.js";

let dataSource: DataSource;

beforeAll(async () => {
    const dataSourceOptions: DataSourceOptions = {
        type: "postgres",
        schema: "public",
        port: +process.env.DB_PORT!,
        host: process.env.DB_HOST!,
        username: process.env.DB_USERNAME!,
        password: process.env.DB_PASSWORD!,
        database: process.env.DB_NAME!,
        entities: [DomainEventEntity, SnapshotEntity, ConsumedMessageEntity, OutboxEntity],
        synchronize: true
    };

    dataSource = new DataSource(dataSourceOptions);

    await dataSource.initialize();
});

afterAll(async () => {
    await dataSource.destroy();
});

afterEach(async () => {
    await dataSource.getRepository(DomainEventEntity).clear();
    await dataSource.getRepository(SnapshotEntity).clear();
    await dataSource.getRepository(ConsumedMessageEntity).clear();
    await dataSource.getRepository(OutboxEntity).clear();
});

export { dataSource };
