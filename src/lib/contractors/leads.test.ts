import { describe, expect, it } from "vitest";
import { checkLeadDraft, type LeadDraft } from "./leads";

const draft: LeadDraft = {
  name: "Sam Rivera",
  email: "sam@home.example",
  phone: "555 0199",
  message: "Two-car garage, about 400 sq ft.",
};

describe("checkLeadDraft", () => {
  it("passes a complete request through", () => {
    expect(checkLeadDraft(draft)).toEqual({ lead: draft, error: null });
  });

  it("trims every field", () => {
    const checked = checkLeadDraft({ name: " Sam Rivera ", email: " sam@home.example", phone: "555 0199 ", message: `\n${draft.message}\n` });
    expect(checked.lead).toEqual(draft);
  });

  it("needs only one way to reply", () => {
    expect(checkLeadDraft({ ...draft, email: "" }).error).toBeNull();
    expect(checkLeadDraft({ ...draft, phone: "" }).error).toBeNull();
  });

  it("allows an empty message", () => {
    expect(checkLeadDraft({ ...draft, message: "  " }).lead?.message).toBe("");
  });

  it.each<[string, Partial<LeadDraft>]>([
    ["a blank name", { name: " " }],
    ["a name that is too long", { name: "a".repeat(81) }],
    ["no way to reply", { email: "", phone: " " }],
    ["an email without a domain", { email: "sam@" }],
    ["a phone number that is too long", { phone: "5".repeat(41) }],
    ["a message that is too long", { message: "a".repeat(2001) }],
  ])("rejects %s", (_label, change) => {
    const checked = checkLeadDraft({ ...draft, ...change });
    expect(checked.lead).toBeNull();
    expect(checked.error).toBeTruthy();
  });
});
