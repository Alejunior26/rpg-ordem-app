import { tokenIsVisible } from './tabletop';

const isPlayer = (p) => p?.kind === 'player' && !/^(npc|monster):/.test(p.userId || '');

// Combat currently identifies players by owner (JOIN validates the character on
// the server but does not persist characterId). Never guess identity from names.
export function participantToken(participant, scene, tokens, privileged) {
  if (!participant || !scene) return null;
  const characterId = participant.characterId || participant.character_id;
  const owned = tokens.filter((t) => !t.deleted && t.scene_id === scene.id && (
    characterId ? t.character_id === characterId && (!t.owner_id || t.owner_id === participant.userId)
      : isPlayer(participant) && t.owner_id === participant.userId && t.kind === 'player'
  ));
  // Ambiguous owners (including one visible + one hidden token) are never
  // automatically associated. Visibility is checked only after identity.
  if (owned.length !== 1) return null;
  return privileged || tokenIsVisible(owned[0], scene, tokens) ? owned[0] : null;
}

export function tabletopCombatView(state, logs = [], privileged = false) {
  const participants = state?.participants || [];
  const safe = privileged ? participants : participants.filter(isPlayer);
  const order = (state?.turn_order || []).map((id) => safe.find((p) => p.userId === id)).filter(Boolean);
  const currentId = state?.turn_order?.[state.turn_index];
  // Free-form legacy logs carry no audience or target IDs. In player view,
  // show player-authored entries only; omit GM/system/NPC prose entirely.
  const hiddenNames = participants.filter((p) => !isPlayer(p)).map((p) => p.nome).filter(Boolean);
  const visibleLogs = privileged ? logs : logs.flatMap((log) => {
    const author = safe.find((p) => p.userId === log.author_id);
    if (!author || hiddenNames.some((name) => `${log.personagem} ${log.acao}`.toLocaleLowerCase().includes(name.toLocaleLowerCase()))) return [];
    return [{ ...log, personagem: author.nome }];
  });
  return { order, participants: safe, current: safe.find((p) => p.userId === currentId), currentId, logs: visibleLogs };
}
