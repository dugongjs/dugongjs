import type { DynamicModule, Type } from "@nestjs/common";

export type TypeOrmFeatureModule = Type<unknown> & {
    forRoot(): DynamicModule;
};
