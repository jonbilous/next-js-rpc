import { createMocks } from "node-mocks-http";
import { describe, expect, test, vi } from "vitest";
import { createApi } from ".";
import zod from "zod";

describe("test createHandler", () => {
  test("context works", async () => {
    const testValue = "user";

    const mockCtx = vi.fn(async () => {
      return new Promise<string>((resolve, reject) =>
        setTimeout(() => resolve(testValue), 2000)
      );
    });

    const { createHandler } = createApi({
      cacheProvider: {
        defaultTtl: 5000,
        get: async <T extends unknown>(key: string) => {
          return "z" as T;
        },
        write: async (key) => {},
        flush: async (key) => {},
      },
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
});
