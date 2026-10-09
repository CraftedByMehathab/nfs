import { describe, expect, it } from "vitest";
import { randomSlug } from "./share";

describe("randomSlug", () => {
  it("is 22 URL-safe characters", () => {
    for (let i = 0; i < 50; i++) {
      expect(randomSlug()).toMatch(/^[A-Za-z0-9_-]{22}$/);
    }
  });

  it("does not repeat", () => {
    const slugs = new Set(Array.from({ length: 200 }, randomSlug));
    expect(slugs.size).toBe(200);
  });
});
