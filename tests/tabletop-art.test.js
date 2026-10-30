// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({
  rpc: vi.fn(),
  file: vi.fn(),
  row: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
}));
vi.mock("node:fs/promises", () => ({ readFile: mock.file }));
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    rpc: mock.rpc,
    from: () => ({ select: mock.select }),
  }),
}));
import { GET } from "../api/tabletop-art.js";
const mid = "00000000-0000-4000-8000-000000000010";
function request(query, token = true) {
  return new Request(
    `https://rpg.test/api/tabletop-art?mission=${mid}${query}`,
    { headers: token ? { Authorization: "Bearer test-jwt" } : {} },
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  const chain = { eq: mock.eq, maybeSingle: mock.row };
  mock.select.mockReturnValue(chain);
  mock.eq.mockReturnValue(chain);
  mock.rpc.mockResolvedValue({ data: true });
  mock.row.mockResolvedValue({ data: { id: "asset" } });
  mock.file.mockResolvedValue(Buffer.from("png-fixture"));
});
describe("protected campaign image delivery", () => {
  it("rejects anonymous requests and path traversal without touching files", async () => {
    expect((await GET(request("&asset=A01", false))).status).toBe(401);
    expect((await GET(request("&asset=..%2F..%2F.env"))).status).toBe(400);
    expect(mock.file).not.toHaveBeenCalled();
  });
  it("returns no image when the caller JWT cannot read its mission asset under RLS", async () => {
    mock.row.mockResolvedValue({ data: null });
    expect((await GET(request("&asset=A13"))).status).toBe(404);
    expect(mock.eq).toHaveBeenCalledWith("mission_id", mid);
    expect(mock.eq).toHaveBeenCalledWith("path", `${mid}/catalog/v6/A13.png`);
    expect(mock.file).not.toHaveBeenCalled();
  });
  it("only serves the catalog to a manager with access to that mission", async () => {
    mock.rpc.mockResolvedValueOnce({ data: false });
    expect((await GET(request(""))).status).toBe(403);
    expect(mock.file).not.toHaveBeenCalled();
  });
  it("serves an authorized image as private PNG without public caching", async () => {
    const result = await GET(request("&asset=A01"));
    expect(result.status).toBe(200);
    expect(result.headers.get("content-type")).toBe("image/png");
    expect(result.headers.get("cache-control")).toBe("private, no-store");
    expect(await result.text()).toBe("png-fixture");
  });
});
