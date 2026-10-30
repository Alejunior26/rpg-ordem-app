import { supabase } from "../lib/supabase";
import { TABLETOP_BUCKET } from "../domain/tabletop";
const signedCache = new Map();
export async function resolveTabletopImages(paths, scope) {
  const unique = [...new Set(paths.filter(Boolean))],
    now = Date.now();
  const missing = unique.filter(
    (path) => (signedCache.get(`${scope}:${path}`)?.expires || 0) < now,
  );
  if (missing.length) {
    const { data, error } = await supabase.storage
      .from(TABLETOP_BUCKET)
      .createSignedUrls(missing, 900);
    if (error) throw error;
    for (const row of data || [])
      if (row.signedUrl)
        signedCache.set(`${scope}:${row.path}`, {
          url: row.signedUrl,
          expires: now + 780000,
        });
  }
  return Object.fromEntries(
    unique.map((path) => [
      path,
      signedCache.get(`${scope}:${path}`)?.url || "",
    ]),
  );
}
export async function uploadTabletopImage(missionId, file, kind, name) {
  if (
    !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
    file.size > 12 * 1024 * 1024
  )
    throw new Error("Escolha uma imagem PNG, JPEG ou WebP de até 12 MB.");
  const extension = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
  }[file.type];
  const path = `${missionId}/${crypto.randomUUID()}.${extension}`;
  const result = await supabase.storage
    .from(TABLETOP_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (result.error)
    throw new Error("Não foi possível enviar a imagem. Tente novamente.");
  const saved = await supabase
    .from("asa_tabletop_assets")
    .insert({ mission_id: missionId, path, name: name.slice(0, 180), kind })
    .select()
    .single();
  if (saved.error) {
    await supabase.storage.from(TABLETOP_BUCKET).remove([path]);
    throw saved.error;
  }
  return saved.data;
}
