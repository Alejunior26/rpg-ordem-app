import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  resolveTabletopImages,
  uploadTabletopImage,
  catalogImage,
  getCampaignCatalog,
} from "../services/tabletopAssets";
const empty = {
  scenes: [],
  tokens: [],
  assets: [],
  room: null,
  images: {},
  loading: true,
  error: "",
};
export function useTabletop(missionId, userId, manager) {
  const [data, setData] = useState({ ...empty, missionId });
  const [busy, setBusy] = useState(false);
  const scope = useRef(null),
    channelRef = useRef(null),
    request = useRef(0),
    working = useRef(false);
  const key = `${missionId}:${userId}:${manager}`;
  if (scope.current !== key) {
    scope.current = key;
    request.current++;
  }
  const refresh = useCallback(async () => {
    if (!missionId) return;
    const ticket = ++request.current;
    try {
      const results = await Promise.all([
        supabase
          .from("asa_tabletop_rooms")
          .select("*")
          .eq("mission_id", missionId)
          .maybeSingle(),
        supabase
          .from("asa_tabletop_scenes")
          .select("*")
          .eq("mission_id", missionId)
          .order("updated_at", { ascending: false }),
        supabase
          .from("asa_tabletop_tokens")
          .select("*")
          .eq("mission_id", missionId)
          .eq("deleted", false),
        manager
          ? supabase
              .from("asa_tabletop_assets")
              .select("*")
              .eq("mission_id", missionId)
              .order("created_at", { ascending: false })
          : Promise.resolve({ data: [] }),
      ]);
      const error = results.find((r) => r.error)?.error;
      if (error) throw error;
      const [room, scenes, tokens, assets] = results.map((r) => r.data);
      const allPaths = [
        ...(scenes || []).map((s) => s.map_path),
        ...(tokens || []).map((t) => t.image_path),
        ...(assets || []).map((a) => a.path),
      ];
      const currentScene =
        (scenes || []).find((s) => s.id === room?.active_scene_id) ||
        (manager ? scenes?.[0] : null);
      const urgent = new Set([
        currentScene?.map_path,
        ...(tokens || [])
          .filter((t) => t.scene_id === currentScene?.id)
          .map((t) => t.image_path),
      ]);
      const paths = allPaths.filter(
        (path) => !catalogImage(path) || urgent.has(path),
      );
      const images = await resolveTabletopImages(paths, key);
      if (scope.current === key && ticket === request.current)
        setData((previous) => ({
          missionId,
          room,
          scenes: scenes || [],
          tokens: tokens || [],
          assets: assets || [],
          images: {
            ...Object.fromEntries(
              Object.entries(
                previous.missionId === missionId ? previous.images : {},
              ).filter(([path]) => allPaths.includes(path)),
            ),
            ...images,
          },
          loading: false,
          error: "",
        }));
    } catch {
      if (scope.current === key && ticket === request.current)
        setData((prev) => ({
          ...prev,
          loading: false,
          error:
            "Não foi possível sincronizar a mesa. Confira a conexão e tente novamente.",
        }));
    }
  }, [missionId, manager, key]);
  const ensureImages = useCallback(
    async (paths) => {
      const unique = [...new Set(paths.filter(Boolean))];
      if (!unique.length) return;
      try {
        const images = await resolveTabletopImages(unique, key);
        if (scope.current === key)
          setData((previous) => ({
            ...previous,
            images: { ...previous.images, ...images },
          }));
      } catch {
        if (scope.current === key)
          setData((previous) => ({
            ...previous,
            error:
              "Não foi possível carregar uma arte. Confira a conexão e tente novamente.",
          }));
      }
    },
    [key],
  );
  useEffect(() => {
    setData({ ...empty, missionId });
    setBusy(false);
    working.current = false;
    if (!missionId) return;
    let disposed = false,
      timer;
    const reload = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (!disposed) void refresh();
      }, 100);
    };
    // Broadcast only invalidates the cache. All game data is re-read under database RLS.
    const channel = supabase
      .channel(`tabletop:${missionId}`)
      .on("broadcast", { event: "refresh" }, reload);
    for (const table of [
      "asa_tabletop_rooms",
      "asa_tabletop_scenes",
      "asa_tabletop_tokens",
    ]) {
      for (const event of ["INSERT", "UPDATE"])
        channel.on(
          "postgres_changes",
          {
            schema: "public",
            table,
            event,
            filter: `mission_id=eq.${missionId}`,
          },
          reload,
        );
    }
    channelRef.current = channel;
    channel.subscribe(reload);
    void refresh();
    const poll = setInterval(reload, 5000);
    window.addEventListener("online", reload);
    return () => {
      disposed = true;
      request.current++;
      clearTimeout(timer);
      clearInterval(poll);
      window.removeEventListener("online", reload);
      supabase.removeChannel(channel);
      if (channelRef.current === channel) channelRef.current = null;
    };
  }, [missionId, refresh]);
  async function run(operation) {
    if (working.current || scope.current !== key) return false;
    working.current = true;
    setBusy(true);
    try {
      const result = await operation();
      if (result?.error) throw result.error;
      if (scope.current !== key) return false;
      void channelRef.current?.send({
        type: "broadcast",
        event: "refresh",
        payload: {},
      });
      await refresh();
      return result?.data || true;
    } catch (error) {
      if (scope.current === key) {
        await refresh();
        setData((prev) => ({
          ...prev,
          error:
            error.code === "40001" || error.message === "conflict"
              ? "A mesa mudou enquanto você agia. Confira a posição atual e tente novamente."
              : error.message === "room areas overlap"
                ? "As marcações das salas se cruzaram. Marque cada sala sem sobrepor as áreas."
                : error.message?.startsWith("Escolha uma imagem")
                  ? error.message
                  : "A ação não foi salva. Confira suas permissões, os limites do mapa e a conexão.",
        }));
      }
      return false;
    } finally {
      if (scope.current === key) {
        working.current = false;
        setBusy(false);
      }
    }
  }
  const update = (table, row, patch) =>
    run(async () => {
      let query = supabase
        .from(table)
        .update(patch)
        .eq("mission_id", missionId)
        .eq("version", row.version);
      query = table === "asa_tabletop_rooms" ? query : query.eq("id", row.id);
      const result = await query.select().maybeSingle();
      if (!result.error && !result.data) throw new Error("conflict");
      return result;
    });
  return {
    ...(data.missionId === missionId ? data : { ...empty, missionId }),
    busy,
    refresh,
    ensureImages,
    installCampaignPack: () =>
      run(async () => {
        const catalog = await getCampaignCatalog(missionId);
        const normalize = (value) =>
          value
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "");
        const replacements = data.assets
          .filter((a) => a.kind === "token" && !catalogImage(a.path))
          .flatMap((old) => {
            const next = catalog.find(
              (item) =>
                item.kind === "token" &&
                [item.name, ...(item.aliases || [])].some(
                  (name) => normalize(name) === normalize(old.name),
                ),
            );
            return next
              ? [
                  {
                    old: old.path,
                    new: `${missionId}/catalog/v6/${next.id}.png`,
                  },
                ]
              : [];
          });
        return supabase.rpc("asa_tabletop_install_catalog", {
          p_mission_id: missionId,
          p_catalog: catalog,
          p_replacements: replacements,
        });
      }),
    updateScene: (row, patch) => update("asa_tabletop_scenes", row, patch),
    updateToken: (row, patch) => update("asa_tabletop_tokens", row, patch),
    hideScene: () =>
      data.room &&
      update("asa_tabletop_rooms", data.room, { active_scene_id: null }),
    createScene: (values) =>
      run(() =>
        supabase
          .from("asa_tabletop_scenes")
          .insert({ mission_id: missionId, ...values })
          .select()
          .single(),
      ),
    activate: (scene) =>
      run(() =>
        supabase.rpc("asa_tabletop_activate", {
          p_scene_id: scene.id,
          p_expected_version: data.room?.version ?? null,
        }),
      ),
    addToken: (values) =>
      run(() =>
        supabase
          .from("asa_tabletop_tokens")
          .insert({ mission_id: missionId, ...values })
          .select()
          .single(),
      ),
    upload: (file, kind, name) =>
      run(async () => ({
        data: await uploadTabletopImage(missionId, file, kind, name),
      })),
  };
}
