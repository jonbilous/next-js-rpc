import { IncomingMessage, ServerResponse } from "http";
import { NextApiRequest, NextApiResponse } from "next";
import zod, { Schema, ZodSchema } from "zod";
import { GetFirstArgument, GetSecondArgument } from "../utils/types";

type Request = IncomingMessage | NextApiRequest;
type Response = ServerResponse | NextApiResponse;

type HandlerDefinition<
  RequestBody = unknown,
  ResponseType = unknown,
  Ctx = unknown,
  Url = unknown
> = {
  url: Url;
  fn: (
    data: RequestBody,
    ctx: HandlerContext<ContextResult<Ctx>>
  ) => Promise<ResponseType>;
  schema?: ZodSchema<RequestBody>;
  ctx?: Ctx;
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

export const createHandler = <
  RequestBody,
  ResponseType,
  Url extends string,
  Ctx extends {
    [key: string]: (ctx: HandlerContext) => any;
  }
>({
  fn,
  schema,
  ctx,
}: HandlerDefinition<RequestBody, ResponseType, Ctx, Url>) => {
  const handler = async (
    req: ApiRequest<RequestBody, Url>,
    res: NextApiResponse<ResponseType>
  ) => {
    try {
      if (req.method !== "POST") {
        return res.status(400).json({ error: "Must use POST" } as any);
      }

      const validated = schema
        ? schema.parse(req.body)
        : zod.any().parse(req.body);

      const contextResult = {} as Record<keyof Ctx, any>;

      await Promise.all(
        Object.entries(ctx || {}).map(async ([key, fn]) => {
          const result = await fn({ req, res });

          contextResult[key as keyof Ctx] = result;
        })
      );

      return fn(validated, { req, res, ...contextResult })
        .then((result) => res.status(200).json(result))
        .catch((err) => res.status(501).end());
    } catch (err) {
      return res.status(400).json({ error: "Error" } as any);
    }
  };

  const serverFn = async (data: RequestBody, { req, res }: HandlerContext) => {
    const contextResult = {} as Record<keyof Ctx, any>;

    await Promise.all(
      Object.entries(ctx || {}).map(async ([key, ctxFn]) => {
        const result = await ctxFn({ req, res });
        contextResult[key as keyof Ctx] = result;
      })
    );

    return fn(data, { ...contextResult, req, res });
  };

  return [handler, serverFn] as const;
};
