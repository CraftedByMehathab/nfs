import { describe, expect, it } from "vitest";
import { checkDraft, type ContractorDraft } from "./profile";

const draft: ContractorDraft = {
  slug: "ace-floors",
  name: "Ace Floors",
  accent: "#1d4ed8",
  email: "hello@acefloors.example",
  phone: "555 0100",
};

describe("checkDraft", () => {
  it("passes a complete profile through", () => {
    expect(checkDraft(draft)).toEqual({ profile: draft, error: null });
  });

  it("trims text and lower-cases the colour", () => {
    const checked = checkDraft({ ...draft, name: "  Ace Floors ", accent: "#1D4ED8", phone: " 555 0100 " });
    expect(checked.profile).toEqual(draft);
  });

  it("stores empty contact details as null", () => {
    const checked = checkDraft({ ...draft, email: " ", phone: "" });
    expect(checked.profile).toMatchObject({ email: null, phone: null });
  });

  it.each<[string, Partial<ContractorDraft>]>([
    ["a blank name", { name: "   " }],
    ["a name that is too long", { name: "a".repeat(81) }],
    ["an address with spaces", { slug: "ace floors" }],
    ["an address that is too short", { slug: "ab" }],
    ["a colour that is not hex", { accent: "blue" }],
    ["an email without a domain", { email: "hello@" }],
    ["a phone number that is too long", { phone: "5".repeat(41) }],
  ])("rejects %s", (_label, change) => {
    const checked = checkDraft({ ...draft, ...change });
    expect(checked.profile).toBeNull();
    expect(checked.error).toBeTruthy();
  });
});
