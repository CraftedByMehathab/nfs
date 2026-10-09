import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { TEMPLATES } from "./index";

const MIGRATIONS = join(process.cwd(), "supabase", "migrations");
const sql = readdirSync(MIGRATIONS)
  .map((file) => readFileSync(join(MIGRATIONS, file), "utf8"))
  .join("\n");

describe("TEMPLATES", () => {
  it("has unique ids", () => {
    const ids = TEMPLATES.map((template) => template.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  // A render is saved with its finish's id, which must exist in the database.
  it.each(TEMPLATES.map((template) => [template.id, template] as const))(
    "%s is seeded in the migrations with the same details",
    (_id, { id, name, category, scale }) => {
      expect(sql).toContain(`('${id}', '${name}', '${category}', ${scale})`);
    },
  );
});
