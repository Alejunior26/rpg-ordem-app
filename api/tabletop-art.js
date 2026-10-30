import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const assetId = /^[A-Z0-9_]{1,20}$/;
export async function GET(request) {
  const url = new URL(request.url),
    mission = url.searchParams.get("mission"),
    id = url.searchParams.get("asset");
  const authorization = request.headers.get("authorization") || "";
  const headers = {
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  };
  const fail = (status) => new Response(null, { status, headers });
  if (!/^Bearer \S+$/.test(authorization)) return fail(401);
  if (!uuid.test(mission || "") || (id && !assetId.test(id))) return fail(400);
  const client = createClient(
    process.env.REACT_APP_SUPABASE_URL ||
      "https://coydyfllhpmiobhnjgsg.supabase.co",
    process.env.REACT_APP_SUPABASE_ANON_KEY ||
      "sb_publishable_v0BGyR8opvlCDD2oGRbQfw_xCoM9JB5",
    {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
  try {
    if (!id) {
      const [role, access] = await Promise.all([
        client.rpc("is_dm_or_admin"),
        client.rpc("asa_can_access_mission", { target: mission }),
      ]);
      if (
        role.error ||
        access.error ||
        role.data !== true ||
        access.data !== true
      )
        return fail(403);
      const catalog = await readFile(
        join(process.cwd(), "campaign-art", "v6", "catalog.json"),
        "utf8",
      );
      return new Response(catalog, {
        headers: {
          ...headers,
          "Content-Type": "application/json; charset=utf-8",
        },
      });
    }
    // Use the caller's JWT and publishable key: RLS decides access to prepared
    // maps and hidden token art. No service-role key or public image folder.
    const { data, error } = await client
      .from("asa_tabletop_assets")
      .select("id")
      .eq("mission_id", mission)
      .eq("path", `${mission}/catalog/v6/${id}.png`)
      .maybeSingle();
    if (error || !data) return fail(404);
    const bytes = await readFile(
      join(process.cwd(), "campaign-art", "v6", `${id}.png`),
    );
    return new Response(bytes, {
      headers: { ...headers, "Content-Type": "image/png" },
    });
  } catch {
    return fail(503);
  }
}
