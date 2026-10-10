import type { Driver, DriverName } from "./driver.js";
import { postgresDriver } from "./postgres-driver.js";
import { sqliteDriver } from "./sqlite-driver.js";

const drivers: Record<DriverName, Driver> = {
    postgres: postgresDriver,
    sqlite: sqliteDriver
};

function resolveDriverName(): DriverName {
    const name = process.env.DB_DRIVER;

    if (!name) {
        throw new Error(
            `DB_DRIVER is not set. The e2e suite runs once per database, so it must name one of: ${Object.keys(drivers).join(", ")}.`
        );
    }

    if (!(name in drivers)) {
        throw new Error(`Unknown DB_DRIVER "${name}". Expected one of: ${Object.keys(drivers).join(", ")}.`);
    }

    return name as DriverName;
}

export const activeDriver = drivers[resolveDriverName()];
