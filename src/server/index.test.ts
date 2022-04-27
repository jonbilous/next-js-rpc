import { createMocks } from "node-mocks-http";
import { describe, expect, test, vi } from "vitest";
import { createApi, HTTPError } from ".";
import zod, { ZodDate } from "zod";
import { CacheProvider } from "types";

const cacheProvider: CacheProvider = {
  defaultTtl: 5000,
  get: async <T extends unknown>(key: string) => {
    return null as T;
  },
  write: async (key) => {},
  flush: async (key) => {},
};

describe("test createHandler", () => {
  test("context works", async () => {
    const testValue = "user";

    const mockCtx = vi.fn(async () => {
      return new Promise<string>((resolve, reject) =>
        setTimeout(() => resolve(testValue), 2000)
      );
    });

    const { createHandler } = createApi({
      cacheProvider,
    });

    const { req, res } = createMocks({ method: "POST" });

    const handler = createHandler({
      url: "/hello",
      fn: async (data, ctx) => {
        return ctx.user;
      },
      schema: zod.any(),
      ctx: {
        user: mockCtx,
      },
    });

    await handler(req, res);

    expect(mockCtx).toBeCalledTimes(1);

    const result = JSON.parse(res._getData());

    expect(result).toBe(testValue);
  });

  test("httperror works in handler", async () => {
    const code = 404;
    const error = "it does not work!";

    const { createHandler } = createApi({
      cacheProvider,
    });

    const { req, res } = createMocks({ method: "POST" });

    const handler = createHandler({
      url: "/hello",
      fn: async (data, ctx) => {
        throw new HTTPError(error, code);
      },

      schema: zod.any(),
    });

    await handler(req, res);

    const result = JSON.parse(res._getData());

    expect(res.statusCode).toBe(code);
    expect(result).toHaveProperty("error");
    expect(result.error).toBe(error);
  });

  test("httperror works in ctx", async () => {
    const code = 404;
    const error = "it does not work!";

    const { createHandler } = createApi({
      cacheProvider,
    });

    const { req, res } = createMocks({ method: "POST" });

    const handler = createHandler({
      url: "/hello",
      fn: async (data, ctx) => {
        return { hello: "world" };
      },
      ctx: {
        user: async () => {
          throw new HTTPError(error, code);
        },
      },
      schema: zod.any(),
    });

    await handler(req, res);

    const result = JSON.parse(res._getData());

    expect(res.statusCode).toBe(code);
    expect(result).toHaveProperty("error");
    expect(result.error).toBe(error);
  });

  test("error returns 501", async () => {
    const { createHandler } = createApi({ cacheProvider });

    const { req, res } = createMocks({ method: "POST" });

    const handler = createHandler({
      url: "/hello",
      fn: async (data, ctx) => {
        return { hello: "world" };
      },
      ctx: {
        user: async () => {
          throw new Error("!!!!!");
        },
      },
      schema: zod.any(),
    });

    await handler(req, res);

    const result = JSON.parse(res._getData());

    expect(res.statusCode).toBe(501);

    expect(result).toHaveProperty("error");

    expect(result.error).toBe("Internal server error");
  });

  test("schema validation", async () => {
    const { createHandler } = createApi({ cacheProvider });

    const { req, res } = createMocks({
      method: "POST",
      body: { mello: "world" },
    });

    const handler = createHandler({
      url: "/hello",
      fn: async (data, ctx) => {
        return data;
      },
      schema: zod.object({ hello: zod.string() }),
    });

    await handler(req, res);

    const result = JSON.parse(res._getData());

    expect(res.statusCode).toBe(404);

    expect(result).toHaveProperty("error");

    expect(result.error).toBe("Input validation error");
  });
});
