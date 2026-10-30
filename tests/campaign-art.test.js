// @vitest-environment node
import { readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";
const catalog = JSON.parse(
  readFileSync(
    new URL("../campaign-art/v6/catalog.json", import.meta.url),
    "utf8",
  ),
);
describe("complete campaign art package", () => {
  it("ships every referenced PNG within the function response limit and with valid grid entries", () => {
    expect(catalog.filter((x) => x.kind === "map")).toHaveLength(19);
    expect(catalog.filter((x) => x.kind === "token")).toHaveLength(19);
    for (const item of catalog) {
      const file = new URL(
        `../campaign-art/v6/${item.id}.png`,
        import.meta.url,
      );
      const png = readFileSync(file);
      expect(png.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
      expect(statSync(file).size).toBeLessThan(4.5 * 1024 * 1024);
      if (item.kind === "token") expect([4, 6]).toContain(png[25]);
      else {
        expect(item.spawn_x).toBeLessThan(item.columns);
        expect(item.spawn_y).toBeLessThan(item.rows);
        expect(item.areas.length).toBeGreaterThan(0);
        for (const area of item.areas) {
          expect(area.x + area.w).toBeLessThanOrEqual(item.columns);
          expect(area.y + area.h).toBeLessThanOrEqual(item.rows);
        }
      }
    }
  });
});
