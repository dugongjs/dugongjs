import { DataSource } from "typeorm";
import { activeDriver } from "../drivers/active-driver.js";

let dataSource: DataSource;

beforeAll(async () => {
    dataSource = new DataSource(activeDriver.createDataSourceOptions());

    await dataSource.initialize();
});

afterAll(async () => {
    await dataSource.destroy();
});

afterEach(async () => {
    const { consumedMessage, domainEvent, outbox, snapshot } = activeDriver.entities;

    await dataSource.getRepository(domainEvent).clear();
    await dataSource.getRepository(snapshot).clear();
    await dataSource.getRepository(consumedMessage).clear();
    await dataSource.getRepository(outbox).clear();
});

export { dataSource };
