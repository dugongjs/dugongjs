import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";

let postgresContainer: StartedPostgreSqlContainer;

export async function setup() {
    const username = process.env.DB_USERNAME!;
    const password = process.env.DB_PASSWORD!;
    const database = process.env.DB_NAME!;

    postgresContainer = await new PostgreSqlContainer("postgres:18")
        .withUsername(username)
        .withPassword(password)
        .withDatabase(database)
        .start();

    process.env.DB_PORT = postgresContainer.getPort().toString();
    process.env.DB_HOST = postgresContainer.getHost();
}

export async function teardown() {
    await postgresContainer.stop();
}
