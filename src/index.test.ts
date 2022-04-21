import { expect, test } from "vitest";
import { hello } from ".";

test("returns hello world", () => {
  const result = hello();

  expect(result).toBe("Hello world");
  expect(result).toBeTruthy();
});
