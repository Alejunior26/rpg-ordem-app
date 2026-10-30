import { supabase } from "../lib/supabase";
import { TABLETOP_BUCKET } from "../domain/tabletop";
const signedCache = new Map();
const pendingImages = new Map(),
  imageQueue = [];
let activeImages = 0;
async function imageSlot(work) {
  if (activeImages >= 4)
    await new Promise((resolve) => imageQueue.push(resolve));
  else activeImages++;
  try {
    return await work();
  } finally {
    const next = imageQueue.shift();
    if (next) next();
    else activeImages--;
  }
}
export function catalogImage(path) {
  const match = /^([0-9a-f-]{36})\/catalog\/v6\/([A-Z0-9_]{1,20})\.png$/i.exec(
    path || "",
  );
  return match ? { mission: match[1], asset: match[2] } : null;
}
async function catalogRequest(missionId, asset) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token)
    throw new Error("Entre novamente para carregar as artes.");
  const params = new URLSearchParams({ mission: missionId });
  if (asset) params.set("asset", asset);
  const response = await fetch(`/api/tabletop-art?${params}`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!response.ok)
    throw new Error("Não foi possível carregar as artes da campanha.");
  return response;
}
export async function getCampaignCatalog(missionId) {
  return (await catalogRequest(missionId)).json();
}
export async function resolveTabletopImages(paths, scope) {
  const unique = [...new Set(paths.filter(Boolean))],
    now = Date.now();
  const missing = unique.filter(
    (path) => (signedCache.get(`${scope}:${path}`)?.expires || 0) < now,
  );
  const privateUploads = missing.filter((path) => !catalogImage(path));
  if (privateUploads.length) {
    const { data, error } = await supabase.storage
      .from(TABLETOP_BUCKET)
      .createSignedUrls(privateUploads, 900);
    if (error) throw error;
    for (const row of data || [])
      if (row.signedUrl)
        signedCache.set(`${scope}:${row.path}`, {
          url: row.signedUrl,
          expires: now + 780000,
        });
  }
  const catalog = missing.filter((path) => catalogImage(path));
  // Small concurrency keeps switching scenes responsive on ordinary connections.
  for (let i = 0; i < catalog.length; i += 4)
    await Promise.all(
      catalog.slice(i, i + 4).map(async (path) => {
        const cacheKey = `${scope}:${path}`;
        if ((signedCache.get(cacheKey)?.expires || 0) >= Date.now()) return;
        if (!pendingImages.has(cacheKey)) {
          const job = imageSlot(async () => {
            const source = catalogImage(path),
              response = await catalogRequest(source.mission, source.asset);
            const old = signedCache.get(cacheKey);
            const url = URL.createObjectURL(await response.blob());
            if (old?.url?.startsWith("blob:")) URL.revokeObjectURL(old.url);
            signedCache.set(cacheKey, { url, expires: Date.now() + 780000 });
          }).finally(() => pendingImages.delete(cacheKey));
          pendingImages.set(cacheKey, job);
        }
        await pendingImages.get(cacheKey);
      }),
    );
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
