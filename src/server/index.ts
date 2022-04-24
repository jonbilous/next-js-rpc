import { NextApiResponse } from "next";
import {
  ApiRequest,
  CacheProvider,
  HandlerContext,
  HandlerDefinition,
} from "types";
import zod from "zod";

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

        const handlerCtx = { req, res, ...contextResult };

        if (cache) {
          const key = cache.getKey(validated, handlerCtx);

          const cachedResult = await cacheProvider.get<ResponseType>(key);

          if (cachedResult) {
            return res.status(200).json(cachedResult);
          }
        }

        return fn(validated, handlerCtx)
          .then((result) => {
            if (cache) {
              const key = cache.getKey(validated, handlerCtx);

              cacheProvider.write(
                key,
                result,
                cache.ttl ?? cacheProvider.defaultTtl
              );
            }

            return res.status(200).json(result);
          })
          .catch((err) => res.status(501).end());
      } catch (err) {
        return res.status(400).json({ error: "Error" } as any);
      }
    };

    const serverFn = async (
      data: RequestBody,
      { req, res }: HandlerContext
    ) => {
      const validated = schema ? schema.parse(data) : zod.any().parse(data);

      const contextResult = {} as Record<keyof Ctx, any>;

      await Promise.all(
        Object.entries(ctx || {}).map(async ([key, ctxFn]) => {
          const result = await ctxFn({ req, res });
          contextResult[key as keyof Ctx] = result;
        })
      );

      const handlerCtx = { ...contextResult, req, res };

      if (cache) {
        const key = cache.getKey(validated, handlerCtx);

        const cachedResult = await cacheProvider.get<ResponseType>(key);

        if (cachedResult) {
          return cachedResult;
        } else {
          const result = await fn(validated, handlerCtx);

          cacheProvider.write(
            key,
            result,
            cache.ttl ?? cacheProvider.defaultTtl
          );

          return result;
        }
      }

      return fn(validated, handlerCtx);
    };

    handler.ssr = serverFn;

    return handler;
  };

  return { createHandler };
};
