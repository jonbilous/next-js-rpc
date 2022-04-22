import { createMocks } from "node-mocks-http";
import { describe, test, expect, vi } from "vitest";
import { createHandler, HandlerContext } from ".";

describe("test createHandler", () => {
  test("context works", async () => {
    const testValue = "user";

    const mockCtx = vi.fn(async () => {
      return new Promise((resolve, reject) =>
        setTimeout(() => resolve(testValue), 2000)
      );
    });

    const { req, res } = createMocks({ method: "POST" });

    const [handler] = createHandler(
      "/hello",
      async (data, ctx) => {
        return ctx.user;
      },
      undefined,
      {
        user: mockCtx,
      }
    );

    await handler(req, res);

    expect(mockCtx).toBeCalledTimes(1);

    const result = JSON.parse(res._getData());

    expect(result).toBe(testValue);
  });
});
