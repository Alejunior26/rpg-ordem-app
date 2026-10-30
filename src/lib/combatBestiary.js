import { asaBestiary } from '../data/asaBestiary';

// Built-in IDs keep their current rules even when the combat saved an older card.
// This only resolves the displayed reference; it never changes persisted combat state.
export function resolveCombatMonster(participant, entries = asaBestiary) {
  const id = participant.monsterId || participant.monster?.id;
  const current = asaBestiary.find((monster) => monster.id === id);
  return current || participant.monster || entries.find((monster) => monster.id === id);
}
