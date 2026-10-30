export const TABLETOP_BUCKET = "asa-tabletop";
export function snapPosition(x, y, scene, size = 1) {
  return {
    x: Math.max(0, Math.min(scene.columns - size, Math.floor(x))),
    y: Math.max(0, Math.min(scene.rows - size, Math.floor(y))),
  };
}
export function tokenInFog(token, fog = []) {
  return fog.some(
    (f) =>
      token.x < f.x + f.w &&
      token.x + token.size > f.x &&
      token.y < f.y + f.h &&
      token.y + token.size > f.y,
  );
}
export function occupiedRooms(scene, tokens = []) {
  if (scene?.vision_mode !== "rooms") return [];
  return (scene.vision_areas || []).filter((area) =>
    tokens.some(
      (pc) =>
        pc.scene_id === scene.id &&
        pc.kind === "player" &&
        pc.visible &&
        !pc.deleted &&
        !tokenInFog(pc, scene.fog) &&
        pc.x + pc.size / 2 >= area.x &&
        pc.x + pc.size / 2 < area.x + area.w &&
        pc.y + pc.size / 2 >= area.y &&
        pc.y + pc.size / 2 < area.y + area.h,
    ),
  );
}
export function darkRooms(scene, tokens = []) {
  const open = occupiedRooms(scene, tokens);
  return scene?.vision_mode === "rooms"
    ? (scene.vision_areas || []).filter((area) => !open.includes(area))
    : [];
}
export function tokenIsVisible(token, scene, tokens = []) {
  return (
    !token.deleted &&
    token.visible &&
    !tokenInFog(token, scene?.fog) &&
    !tokenInFog(token, darkRooms(scene, tokens))
  );
}
export function characterSpawn(scene, tokens = []) {
  const cells = [];
  for (let y = 0; y < scene.rows; y++)
    for (let x = 0; x < scene.columns; x++) cells.push({ x, y });
  cells.sort(
    (a, b) =>
      Math.abs(a.x - (scene.spawn_x || 0)) +
      Math.abs(a.y - (scene.spawn_y || 0)) -
      (Math.abs(b.x - (scene.spawn_x || 0)) +
        Math.abs(b.y - (scene.spawn_y || 0))),
  );
  return cells.find(
    (cell) =>
      !tokenInFog({ ...cell, size: 1 }, scene.fog) &&
      !tokens.some(
        (t) =>
          !t.deleted &&
          cell.x < t.x + t.size &&
          cell.x + 1 > t.x &&
          cell.y < t.y + t.size &&
          cell.y + 1 > t.y,
      ),
  );
}
export function canMoveToken(token, scene, userId, manager, preview = false) {
  return (
    !preview &&
    !token.deleted &&
    (manager ||
      (scene.allow_player_moves &&
        token.visible &&
        token.owner_id === userId &&
        !tokenInFog(token, scene.fog)))
  );
}
export function fogRectangle(start, end, scene) {
  const a = snapPosition(start.x, start.y, scene),
    b = snapPosition(end.x, end.y, scene);
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    w: Math.abs(a.x - b.x) + 1,
    h: Math.abs(a.y - b.y) + 1,
  };
}
export function safeImageUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}
export function campaignFolderImages(files) {
  // Import only preferred maps and current creature art; never PDFs or obsolete previews.
  return Array.from(files)
    .filter((f) => /\.(png|jpe?g|webp)$/i.test(f.name))
    .map((file) => {
      const path = (file.webkitRelativePath || file.name).replaceAll("\\", "/");
      let kind = null;
      if (
        /MAPAS\/(Originais_Torre|Santa_Iris|Arenas)\//i.test(path) &&
        !/mapa_completo|_grid\./i.test(path.replace("_sem_grid.", "_nogrid."))
      )
        kind = "map";
      if (
        /Revisao_5_1\//i.test(path) ||
        /Imagens_Inimigos\/(drone_beija_flor_asa|agente_de_contencao_asa|katia_moura)\.png$/i.test(
          path,
        ) ||
        /Reservado_Mestre\//i.test(path) ||
        /PERSONAGENS\/Artes\//i.test(path)
      )
        kind = "token";
      return {
        file,
        kind,
        name: file.name
          .replace(/\.[^.]+$/, "")
          .replace(/_v5_1$/, "")
          .replaceAll("_", " "),
      };
    })
    .filter((x) => x.kind);
}
