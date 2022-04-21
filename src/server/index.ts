import { NextApiRequest, NextApiResponse } from "next";
import zod, { Schema, ZodSchema } from "zod";
import { IncomingMessage, ServerResponse } from "http";
import { GetFirstArgument, GetSecondArgument } from "../utils/types";

type Request = IncomingMessage | NextApiRequest;
type Response = ServerResponse | NextApiResponse;

export interface Context {
  req: Request;
  res: Response;
}

export type ApiFunction = (...args: any[]) => any;

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

export const createHandler = <RequestBody, ResponseType>(
  fn: (data: RequestBody, ctx: Context) => Promise<ResponseType>,
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

      return fn(validated, { req, res })
        .then((result) => res.status(200).json(result))
        .catch((err) => res.status(501).end());
    } catch (err) {
      return res.status(400).json({ error: "Request validation error" } as any);
    }
  };

  return handler;
};