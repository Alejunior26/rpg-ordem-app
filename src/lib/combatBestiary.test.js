// @vitest-environment node
import { expect, it } from 'vitest';
import { asaBestiary } from '../data/asaBestiary';
import { resolveCombatMonster } from './combatBestiary';

it('uses revised built-in rules for old saved combat cards without rewriting the encounter', () => {
  const oldCard = { id: 'maestro', hp: '280', actions: [{ name: 'Fechar o Palco', text: 'convoca 1 Portador' }] };
  const participant = { userId: 'monster:maestro:1', monsterId: 'maestro', monster: oldCard };
  const before = JSON.stringify(participant);
  expect(resolveCombatMonster(participant)).toBe(asaBestiary.find((monster) => monster.id === 'maestro'));
  expect(JSON.stringify(participant)).toBe(before);
});

it('preserves custom cards and resolves participants that only saved a catalog ID', () => {
  const custom = { id: 'custom:1', actions: [{ name: 'Ataque próprio' }] };
  expect(resolveCombatMonster({ monsterId: custom.id, monster: custom })).toBe(custom);
  expect(resolveCombatMonster({ monsterId: custom.id }, [custom])).toBe(custom);
  expect(resolveCombatMonster({ monsterId: 'portador-ruina' })?.code).toBe('A08');
  expect(resolveCombatMonster({ monsterId: 'missing' })).toBeUndefined();
});
