import { describe, expect, it } from "vitest";
import { DEFAULT_ACCENT, isAccent, luminance, textColourOn } from "./accent";

describe("isAccent", () => {
  it("accepts lower-case #rrggbb", () => {
    expect(isAccent("#0a7f3c")).toBe(true);
    expect(isAccent(DEFAULT_ACCENT)).toBe(true);
  });

  it.each(["", "#fff", "#0A7F3C", "0a7f3c", "#0a7f3g", "red"])("rejects %j", (colour) => {
    expect(isAccent(colour)).toBe(false);
  });
});

describe("luminance", () => {
  it("runs from 0 for black to 1 for white", () => {
    expect(luminance("#000000")).toBe(0);
    expect(luminance("#ffffff")).toBeCloseTo(1, 6);
  });
});

describe("textColourOn", () => {
  it("puts white text on dark backgrounds", () => {
    expect(textColourOn("#18181b")).toBe("#ffffff");
    expect(textColourOn("#1d4ed8")).toBe("#ffffff");
  });

  it("puts black text on light backgrounds", () => {
    expect(textColourOn("#ffffff")).toBe("#000000");
    expect(textColourOn("#facc15")).toBe("#000000");
  });
});
