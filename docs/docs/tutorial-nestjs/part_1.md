---
title: "Part 1 - Setting Up NestJS with ESM, Vite and TypeORM"
sidebar_position: 2
---

![DugongJS + NestJS](/img/dugongjs_nestjs.png)

In this part, we'll set up a new NestJS project and configure everything needed to get started.

First, create a new NestJS project by following the [NestJS First Steps guide](https://docs.nestjs.com/first-steps).

Then install the required DugongJS packages:

```bash
npm install @dugongjs/core @dugongjs/nestjs
```

### Setting Up ESM with Vite

DugongJS is built for native ECMAScript Modules (ESM), but NestJS is configured for CommonJS (CJS) by default. There are several ways to configure NestJS with ESM. In this tutorial, we'll be using [Vite](https://vite.dev/) (and [ViteNode](https://www.npmjs.com/package/vite-node) in development). If you have another preferred way of setting up ESM, feel free to skip this part.

Install the required dev dependencies:

```bash
npm install --save-dev vite vite-node vite-plugin-node dotenv-cli
```

Then create a `vite.config.ts` file:

```typescript title="vite.config.ts" showLineNumbers
import { defineConfig } from "vite";
import { VitePluginNode } from "vite-plugin-node";

export default defineConfig({
    build: {
        ssr: true,
        outDir: "./dist"
    },
    plugins: [
        ...VitePluginNode({
            adapter: "nest",
            appPath: "./src/main.ts",
            tsCompiler: "swc",
            outputFormat: "esm",
            swcOptions: {
                minify: false
            }
        })
    ]
});
```

Next, in `package.json,` set the `type` to `module` to declare it an ESM module and update the scripts to use `vite` for production build and `vite-node` for development.

```json title="package.json"
{
    "type": "module",
    "scripts": {
        "build": "vite build",
        "start:dev": "dotenv -e .env -- vite-node src/main.ts"
    }
}
```

Finally, update your `tsconfig.json` to support ESM:

```json title="tsconfig.json"
{
    "compilerOptions": {
        "module": "NodeNext",
        "moduleResolution": "NodeNext"
    }
}
```

:::warning
When using `NodeNext` module resolution, TypeScript requires all file imports to end in .js — even when importing TypeScript files. This will cause all your existing imports to error if they use the default module resolution. [Learn more](https://www.typescriptlang.org/docs/handbook/modules/theory.html#module-resolution).
:::

Verify that everything has been set up correctly by running the following script:

```bash
npm run start:dev
```

You should see the normal log output from NestJS.

Also verify the build script:

```bash
npm run build
```

And make sure the `dist` folder contains a `main.js` file.

### Installing TypeORM and PostgreSQL

We’ll use [TypeORM](https://typeorm.io/) for persistence and configure it with PostgreSQL.

Install the following dependencies:

```bash
npm install typeorm @nestjs/typeorm @dugongjs/typeorm @dugongjs/nestjs-typeorm
```

To keep things organized, we’ll store our database configuration in a dedicated folder. Add the following to your project:

```json
📁 src
└─ 📁 db
│  └─ 📄 data-source-options.ts
```

Create a data source configuration file:

```typescript title="src/db/data-source-options.ts" showLineNumbers
import { ConsumedMessageEntity, DomainEventEntity, SnapshotEntity } from "@dugongjs/typeorm";
import type { DataSourceOptions } from "typeorm";

export const dataSourceOptions: DataSourceOptions = {
    type: "postgres",
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    synchronize: true,
    logging: false,
    entities: [DomainEventEntity, SnapshotEntity, ConsumedMessageEntity]
};
```

:::warning
Setting `synchronize: true` automatically generates tables based on your entities. This is useful during development, but should be disabled in production environments in favor of migrations.
:::

:::info
In this tutorial, we're just using `process.env` to access environmental variables, but you could also use the `ConfigModule` from `@nestjs/config` for that.
:::

Create a `.env` file at the root of your project with your database settings:

```conf title=".env" showLineNumbers
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres_user
DB_PASSWORD=postgres_password
DB_NAME=account_service_db
```

### Setting Up PostgreSQL with Docker Compose

If you don’t already have a PostgreSQL instance, you can spin one up with Docker. Create a `docker-compose.yaml` file:

```yaml title="docker-compose.yaml" showLineNumbers
<!-- prettier-ignore-start -->
services:
  postgres:
    image: postgres:14
    container_name: nestjs_tutorial_account_service_db
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres_user
      POSTGRES_PASSWORD: postgres_password
      POSTGRES_DB: account_service_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
<!-- prettier-ignore-end -->
```

Start the container:

```bash
docker compose up
```

### Configuring the App Module

In `src/app.module.ts`, connect TypeORM, the DugongJS adapters, and set the current origin for event publishing:

```typescript title="src/app.module.ts"showLineNumbers
import { EventIssuerModule } from "@dugongjs/nestjs";
import { RepositoryTypeOrmModule, TransactionManagerTypeOrmModule } from "@dugongjs/nestjs-typeorm";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { dataSourceOptions } from "./db/data-source-options.js";

@Module({
    imports: [
        TypeOrmModule.forRoot(dataSourceOptions),
        RepositoryTypeOrmModule.forRoot(),
        TransactionManagerTypeOrmModule.forRoot(),
        EventIssuerModule.forRoot({ currentOrigin: "BankingContext-AccountService" })
    ]
})
export class AppModule {}
```

Let’s break down what each module does:

- `TypeOrmModule.forRoot()` sets up TypeORM using our previously defined config.
- `RepositoryTypeOrmModule` provides adapters for the DugongJS [repository ports](../ports/repositories.md).
- `TransactionManagerTypeOrmModule` provides an adapter for the DugongJS [transaction manager port](../ports/transaction-manager.md).
- `EventIssuerModule` configures the `currentOrigin` — a label that identifies which service owns the aggregates and emits domain events. See [origin](../core-concepts/origin.md) for more details.

In the next part, we’ll implement the domain layer, including the aggregate, domain events, and commands for our bank account model.
