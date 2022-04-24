import { IncomingMessage, ServerResponse } from "http";
import { NextApiRequest, NextApiResponse } from "next";
import zod, { Schema, ZodSchema } from "zod";

type GetFirstArgument<T> = T extends (
  first: infer FirstArgument,
  ...args: any[]
) => any
  ? FirstArgument
  : never;

type GetSecondArgument<T> = T extends (
  first: any,
  second: infer SecondArgument,
  ...args: any[]
) => any
  ? SecondArgument
  : never;

export type Request = IncomingMessage | NextApiRequest;
export type Response = ServerResponse | NextApiResponse;

export type HandlerDefinition<RequestBody, ResponseType, Ctx, Url> = {
  url: Url;
  fn: (
    data: RequestBody,
    ctx: HandlerContext<ContextResult<Ctx>>
  ) => Promise<ResponseType>;
  schema?: ZodSchema<RequestBody>;
  ctx?: Ctx;
  cache?: {
    ttl?: number;
    getKey: (
      data: RequestBody,
      ctx: HandlerContext<ContextResult<Ctx>>
    ) => string;
  };
};

export type HandlerContext<T = {}> = T & {
  req: Request;
  res: Response;
};

export type ContextResult<Ctx> = {
  [key in keyof Ctx]: Ctx[key] extends (ctx: HandlerContext) => infer ReturnTpe
    ? Awaited<ReturnTpe>
    : never;
};

export interface ApiRequest<T, E> extends NextApiRequest {
  body: T;
  endpoint: E;
}

export type InferSchema<T extends Schema> = zod.infer<T>;

export type InferRequest<T> = GetFirstArgument<T> extends ApiRequest<
  infer T,
  any
>
  ? T
  : never;

export type InferResponse<T> = GetSecondArgument<T> extends NextApiResponse<
  infer T
>
  ? T
  : never;

export type InferUrl<T> = GetFirstArgument<T> extends ApiRequest<any, infer E>
  ? E
  : never;

export interface CacheProvider {
  get: <T extends unknown>(key: string) => Promise<T>;
  write: <T extends unknown>(
    key: string,
    data: T,
    ttl: number
  ) => Promise<void>;
  flush: (key: string) => Promise<any>;
  defaultTtl: number;
}

export type ApiFunction = (...args: any[]) => any;

export type QueryResult<F extends ApiFunction> = Awaited<ReturnType<F>>;
export type QueryArrayResult<F extends ApiFunction> = QueryResult<F>[number];
