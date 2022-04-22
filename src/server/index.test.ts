import { createMocks } from "node-mocks-http";
import { describe, expect, test, vi } from "vitest";
import { createHandler } from ".";

describe("test createHandler", () => {
  test("context works", async () => {
    const testValue = "user";

    const mockCtx = vi.fn(async () => {
      return new Promise((resolve, reject) =>
        setTimeout(() => resolve(testValue), 2000)
      );
    });

    const { req, res } = createMocks({ method: "POST" });

    const handler = createHandler({
      url: "/hello",
      fn: async (data, ctx) => {
        return ctx.user;
      },
      schema: undefined,
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
