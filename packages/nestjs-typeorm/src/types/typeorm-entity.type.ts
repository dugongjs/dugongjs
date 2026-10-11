import type { Constructor } from "@dugongjs/core";
import type { EntitySchema } from "typeorm";

export type TypeOrmEntity = Constructor<unknown> | EntitySchema;
