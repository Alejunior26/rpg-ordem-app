import { describe, it, expect, vi } from 'vitest';
import { createCharacterSaveQueue } from './characterStore';

const storage = () => {
  const values = new Map();
  return { getItem: (k) => values.get(k) || null, setItem: (k,v) => values.set(k,v), removeItem: (k) => values.delete(k), values };
};
describe('character persistence', () => {
  it('does not announce a save when flushing an unchanged sheet or an empty queue', async () => {
    const save = vi.fn().mockResolvedValue({ revision: 1 });
    const onStatus = vi.fn();
    const queue = createCharacterSaveQueue({ save, storage: storage(), ownerId: 'owner', onStatus });
    queue.seed('a', 0, { pv: 20 });
    queue.enqueue('a', { pv: 20 });
    expect(await queue.flush()).toBe(true);
    expect(save).not.toHaveBeenCalled();
    expect(onStatus).not.toHaveBeenCalled();
    queue.enqueue('a', { pv: 19 });
    await queue.flush();
    expect(onStatus).toHaveBeenLastCalledWith({ state: 'saved', message: 'Ficha salva.' });
    onStatus.mockClear();
    expect(await queue.flush()).toBe(true);
    expect(save).toHaveBeenCalledTimes(1);
    expect(onStatus).not.toHaveBeenCalled();
  });
  it('serializes saves and uses the new revision for edits made during an in-flight save', async () => {
    let release;
    const save = vi.fn().mockImplementationOnce(() => new Promise((resolve) => { release=resolve; })).mockResolvedValueOnce({ revision: 2 });
    const queue = createCharacterSaveQueue({ save, storage: storage(), ownerId: 'owner' });
    queue.seed('a',0,{ pv:20 }); queue.enqueue('a',{ pv:19 });
    const first=queue.flush(); queue.enqueue('a',{ pv:18 });
    release({ revision:1 }); await first;
    expect(save.mock.calls).toEqual([['a',0,{pv:19}],['a',1,{pv:18}]]);
    expect(queue.hasPending()).toBe(false);
  });
  it('preserves a local draft after network failure and restores it after reload', async () => {
    const local=storage(); const status=vi.fn();
    const queue=createCharacterSaveQueue({ save:vi.fn().mockRejectedValue(new Error('offline')), storage:local, ownerId:'owner', onStatus:status });
    queue.seed('a',0,{pv:20}); queue.enqueue('a',{pv:17});
    expect(await queue.flush()).toBe(false);
    const restored=createCharacterSaveQueue({save:vi.fn().mockResolvedValue({revision:1}),storage:local,ownerId:'owner'});
    expect(restored.seed('a',0,{pv:20})).toEqual({pv:17});
    expect(await restored.flush()).toBe(true); expect(local.values.size).toBe(0);
  });
  it('blocks stale recovered drafts and never overwrites a newer server version', async () => {
    const local=storage(); const save=vi.fn(); const statuses=[];
    local.setItem('asa-pending-v1:owner:a',JSON.stringify({ownerId:'owner',revision:0,snapshot:{pv:1}}));
    const queue=createCharacterSaveQueue({save,storage:local,ownerId:'owner',onStatus:s=>statuses.push(s)});
    expect(queue.seed('a',2,{pv:20})).toEqual({pv:20});
    expect(await queue.flush()).toBe(false); expect(save).not.toHaveBeenCalled();
    expect(queue.exportPending().a.snapshot).toEqual({pv:1});
    expect(statuses.at(-1).state).toBe('conflict');
  });
  it('keeps A and B independent when a user switches characters', async () => {
    const save=vi.fn().mockResolvedValue({revision:1}); const queue=createCharacterSaveQueue({save,storage:storage(),ownerId:'owner'});
    queue.seed('a',0,{nome:'A'}); queue.seed('b',0,{nome:'B'});
    queue.enqueue('a',{nome:'A',pv:10}); await queue.flush();
    queue.enqueue('b',{nome:'B',pv:20}); await queue.flush();
    expect(save.mock.calls).toEqual([['a',0,{nome:'A',pv:10}],['b',0,{nome:'B',pv:20}]]);
  });
});
