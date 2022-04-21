import { NextApiRequest, NextApiResponse } from "next";
import zod, { Schema, ZodSchema } from "zod";

export type ApiFunction = (...args: any[]) => any;

export type FunctionHandler<
  RequestSchema extends Schema,
  T extends undefined
> = (data: InferSchema<RequestSchema>, request?: NextApiRequest) => Promise<T>;

export interface ApiRequest<T> extends NextApiRequest {
  body: T;
}

export type InferSchema<T extends Schema> = zod.infer<T>;
export type QueryResult<F extends ApiFunction> = Awaited<ReturnType<F>>;
export type QueryArrayResult<F extends ApiFunction> = QueryResult<F>[number];

export type InferRequest<T> = GetFirstArgument<T> extends ApiRequest<infer T>
  ? T
  : never;

export type InferResponse<T> = GetSecondArgument<T> extends NextApiResponse<
  infer T
>
  ? T
  : never;

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

export const createHandler = <RequestBody, ResponseType>(
  fn: (data: RequestBody, req?: NextApiRequest) => Promise<ResponseType>,
  schema?: ZodSchema<RequestBody>
) => {
  const handler = (
    req: ApiRequest<RequestBody>,
    res: NextApiResponse<ResponseType>
  ) => {
    try {
      if (req.method !== "POST") {
        return res.status(400).json({ error: "Must use POST" } as any);
      }

      const validated = schema
        ? schema.parse(req.body)
        : zod.any().parse(req.body);

      return fn(validated, req)
        .then((result) => res.status(200).json(result))
        .catch((err) => res.status(501).end());
    } catch (err) {
      return res.status(400).json({ error: "Request validation error" } as any);
    }
  };

  return handler;
};
