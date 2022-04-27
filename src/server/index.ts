import { NextApiResponse } from "next";
import type {
  ApiRequest,
  CacheProvider,
  ContextResult,
  HandlerContext,
  HandlerDefinition,
} from "../types";
import zod from "zod";
import superjson from "superjson";

export class HTTPError extends Error {
  constructor(public message: string, public status: number) {
    super(message);
  }
}

export * from "./ssrProvider";

export const createApi = ({
  cacheProvider,
}: {
  cacheProvider: CacheProvider;
}) => {
  const createHandler = <
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
    cache,
    url,
  }: HandlerDefinition<RequestBody, ResponseType, Ctx, Url>) => {
    const validate = (data: RequestBody) => {
      try {
        return schema ? schema.parse(data) : zod.any().parse(data);
      } catch (err) {
        throw new HTTPError("Input validation error", 404);
      }
    };

    const buildContext = async ({ req, res }: HandlerContext) => {
      const contextResult = {} as Record<keyof Ctx, any>;

      await Promise.all(
        Object.entries(ctx || {}).map(async ([key, fn]) => {
          const result = await fn({ req, res });

          contextResult[key as keyof Ctx] = result;
        })
      );

      return { req, res, ...contextResult };
    };

    const getResult = async (
      data: RequestBody,
      ctx: HandlerContext,
      fn: (
        data: RequestBody,
        ctx: HandlerContext<ContextResult<Ctx>>
      ) => Promise<ResponseType>
    ) => {
      const validatedData = validate(data);

      const handlerCtx = await buildContext({ req: ctx.req, res: ctx.res });

      if (cache) {
        const key = [url, cache.getKey(validatedData, handlerCtx)].join("-");

        const cachedResult = await cacheProvider
          .get<ResponseType>(key)
          .catch((err) => null);

        if (cachedResult) {
          return cachedResult;
        } else {
          const result = await fn(validatedData, handlerCtx);

          cacheProvider.write(
            key,
            result,
            cache.ttl ?? cacheProvider.defaultTtl
          );

          return result;
        }
      }

      return fn(validatedData, handlerCtx);
    };

    const handler = async (
      req: ApiRequest<RequestBody, Url>,
      res: NextApiResponse<ResponseType>
    ) => {
      if (req.method !== "POST") {
        return res
          .status(400)
          .json(superjson.serialize({ error: "Must use POST" }) as any);
      }

      return getResult(req.body, { req, res }, fn)
        .then((result) => {
          return res.status(200).json(superjson.serialize(result) as any);
        })
        .catch((err) => {
          const message =
            err instanceof HTTPError ? err.message : "Internal server error";

          const code = err instanceof HTTPError ? err.status : 501;

          return res
            .status(code)
            .json(superjson.serialize({ error: message }) as any);
        });
    };

    handler.ssr = (
      data: RequestBody,
      { req, res }: HandlerContext
    ): Promise<ResponseType> => {
      return getResult(data, { req, res }, fn);
    };

    return handler;
  };

  return { createHandler };
};
