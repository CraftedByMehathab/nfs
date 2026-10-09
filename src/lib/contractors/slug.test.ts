import { describe, expect, it } from "vitest";
import { isValidSlug, slugify, SLUG_MAX_LENGTH } from "./slug";

describe("slugify", () => {
  it("joins the words of a name with hyphens", () => {
    expect(slugify("Ace Floors & Co.")).toBe("ace-floors-co");
  });

  it("drops accents rather than the letters under them", () => {
    expect(slugify("Señor Épóxy")).toBe("senor-epoxy");
  });

  it("trims hyphens left at either end", () => {
    expect(slugify("  --Ace--  ")).toBe("ace");
  });

  it("keeps long names within the limit without a trailing hyphen", () => {
    const slug = slugify(`${"a".repeat(SLUG_MAX_LENGTH - 1)} floors`);
    expect(slug).toBe("a".repeat(SLUG_MAX_LENGTH - 1));
  });

  it("gives a valid address for an ordinary name", () => {
    expect(isValidSlug(slugify("Garage Kings of Austin"))).toBe(true);
  });
});

describe("isValidSlug", () => {
  it("accepts lower-case words joined by single hyphens", () => {
    expect(isValidSlug("ace-floors-2")).toBe(true);
  });

  it.each(["", "ab", "Ace", "ace floors", "ace--floors", "-ace", "ace-", "ace/floors", "a".repeat(SLUG_MAX_LENGTH + 1)])(
    "rejects %j",
    (slug) => {
      expect(isValidSlug(slug)).toBe(false);
    },
  );
});
