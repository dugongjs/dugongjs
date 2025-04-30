import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";

let postgresContainer: StartedPostgreSqlContainer;

export async function setup() {
    const username = process.env.DB_USERNAME!;
    const password = process.env.DB_PASSWORD!;
    const database = process.env.DB_NAME!;

    console.log(
        `Starting PostgreSQL test container with username: ${username}, password: ${password}, database: ${database}`
    );
    postgresContainer = await new PostgreSqlContainer()
        .withUsername(username)
        .withPassword(password)
        .withDatabase(database)
        .start();

    const port = postgresContainer.getPort();
    const host = postgresContainer.getHost();

    console.log(`PostgreSQL test container started on ${host}:${port}`);

    process.env.DB_PORT = port.toString();
    process.env.DB_HOST = host;
}

export async function teardown() {
    await postgresContainer.stop();
    console.log("PostgreSQL container stopped");
}
