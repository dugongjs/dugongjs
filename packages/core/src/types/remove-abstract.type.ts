export type RemoveAbstract<TAbstractClass extends abstract new (...args: any[]) => any> =
    TAbstractClass extends abstract new (...args: infer TArgs) => infer TInstance
        ? new (...args: TArgs) => TInstance
        : never;
