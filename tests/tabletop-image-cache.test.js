// @vitest-environment node
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ session: vi.fn() }));
vi.mock("../src/lib/supabase", () => ({
  supabase: { auth: { getSession: mock.session } },
}));
const mid = "00000000-0000-4000-8000-000000000010";
const path = (n) => `${mid}/catalog/v6/A0${n}.png`;
beforeEach(() => {
  vi.resetModules();
  mock.session.mockResolvedValue({
    data: { session: { access_token: "jwt" } },
  });
});
afterEach(() => {
  vi.unstubAllGlobals();
});
describe("protected image loading", () => {
  it("shares one authenticated download between simultaneous requests for the same image", async () => {
    let release;
    const fetch = vi.fn(
      () =>
        new Promise((resolve) => {
          release = () => resolve(new Response("png"));
        }),
    );
    vi.stubGlobal("fetch", fetch);
    const { resolveTabletopImages } = await import(
      "../src/services/tabletopAssets.js"
    );
    const one = resolveTabletopImages([path(1)], "scope"),
      two = resolveTabletopImages([path(1)], "scope");
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    release();
    const [a, b] = await Promise.all([one, two]);
    expect(a[path(1)]).toBe(b[path(1)]);
    expect(fetch.mock.calls[0][1].headers.Authorization).toBe("Bearer jwt");
  });
  it("keeps the global download limit across independently requested thumbnails", async () => {
    let active = 0,
      max = 0;
    const releases = [];
    const fetch = vi.fn(() => {
      active++;
      max = Math.max(max, active);
      return new Promise((resolve) =>
        releases.push(() => {
          active--;
          resolve(new Response("png"));
        }),
      );
    });
    vi.stubGlobal("fetch", fetch);
    const { resolveTabletopImages } = await import(
      "../src/services/tabletopAssets.js"
    );
    const all = Promise.all(
      [1, 2, 3, 4, 5, 6].map((n) => resolveTabletopImages([path(n)], "scope")),
    );
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(4));
    releases.splice(0).forEach((release) => release());
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(6));
    releases.splice(0).forEach((release) => release());
    await all;
    expect(max).toBe(4);
  });
});
