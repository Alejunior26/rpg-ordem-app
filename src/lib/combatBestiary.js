// Only the active mission's catalogue can update an old saved combat card.
// Saved snapshots still work without fetching a different campaign's catalogue.
export function resolveCombatMonster(participant, entries = []) {
  const id = participant.monsterId || participant.monster?.id;
  return entries.find((monster) => monster.id === id) || participant.monster;
}
