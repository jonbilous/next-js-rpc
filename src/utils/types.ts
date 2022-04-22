export type GetFirstArgument<T> = T extends (
  first: infer FirstArgument,
  ...args: any[]
) => any
  ? FirstArgument
  : never;

export type GetSecondArgument<T> = T extends (
  first: any,
  second: infer SecondArgument,
  ...args: any[]
) => any
  ? SecondArgument
  : never;

export type ApiFunction = (...args: any[]) => any;

export type QueryResult<F extends ApiFunction> = Awaited<ReturnType<F>>;
export type QueryArrayResult<F extends ApiFunction> = QueryResult<F>[number];
