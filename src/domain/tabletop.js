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
