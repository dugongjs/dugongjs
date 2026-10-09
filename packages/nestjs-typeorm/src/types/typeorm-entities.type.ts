import type { TypeOrmEntity } from "./typeorm-entity.type.js";

/**
 * The entity set for one database driver. Each driver ships its own set, since column types differ
 * between databases, and binds it to the modules and adapters exported from its subpath.
 */
export type TypeOrmEntities = {
    consumedMessage: TypeOrmEntity;
    domainEvent: TypeOrmEntity;
    outbox: TypeOrmEntity;
    snapshot: TypeOrmEntity;
};
