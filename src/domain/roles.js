export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value) {
  return typeof value === "string" && UUID_RE.test(value);
}

export function normalizeRole(value) {
  if (value === "adm") return "admin";
  if (value === "jogador") return "player";
  if (value === "dm" || value === "admin" || value === "player") return value;
  return "player";
}

export function canManageTable(value) {
  const normalized = normalizeRole(value);
  return normalized === "dm" || normalized === "admin";
}
