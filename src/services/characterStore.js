export function createCharacterSaveQueue({ save, storage, ownerId, onStatus = () => {}, onSaved = () => {} }) {
  const revisions = new Map();
  const pending = new Map();
  const confirmed = new Map();
  let running = null;
  let blocked = null;
  const key = (id) => `asa-pending-v1:${ownerId}:${id}`;
  const stash = (id, job) => {
    try { storage?.setItem(key(id), JSON.stringify({ ownerId, ...job })); }
    catch { onStatus({ state: 'error', message: 'Não foi possível guardar a cópia local. Mantenha esta página aberta.' }); }
  };
  return {
    seed(id, revision, snapshot) {
      if (!pending.has(id)) revisions.set(id, revision);
      confirmed.set(id, JSON.stringify(snapshot));
      try {
        const cached = JSON.parse(storage?.getItem(key(id)) || 'null');
        if (cached?.ownerId === ownerId && cached.snapshot) {
          pending.set(id, cached);
          // Never silently overwrite a newer server revision after a reload.
          if (cached.revision !== revision) {
            blocked = id;
            onStatus({ state: 'conflict', message: 'Existe uma cópia local e uma versão mais recente no servidor. Exporte a cópia antes de recarregar.' });
            return snapshot;
          }
          onStatus({ state: 'pending', message: 'Alterações locais recuperadas; aguardando sincronização.' });
          return cached.snapshot;
        }
      } catch { onStatus({ state: 'error', message: 'Não foi possível ler a cópia local.' }); }
      return snapshot;
    },
    enqueue(id, snapshot) {
      const serialized = JSON.stringify(snapshot);
      if (confirmed.get(id) === serialized && !pending.has(id)) return;
      const job = { revision: revisions.get(id), snapshot };
      pending.set(id, job);
      stash(id, job);
      if (!blocked) onStatus({ state: 'pending', message: 'Alterações pendentes.' });
    },
    async flush() {
      if (running) return running;
      if (blocked) return false;
      if (!pending.size) return true;
      running = (async () => {
        while (pending.size) {
          const [id, job] = pending.entries().next().value;
          onStatus({ state: 'saving', message: 'Salvando ficha…' });
          try {
            const result = await save(id, revisions.get(id), job.snapshot);
            revisions.set(id, result.revision);
            confirmed.set(id, JSON.stringify(job.snapshot));
            onSaved(id, result);
            if (pending.get(id) === job) {
              pending.delete(id);
              try { storage?.removeItem(key(id)); } catch { /* server save succeeded */ }
            } else {
              const next = pending.get(id);
              next.revision = result.revision;
              stash(id, next);
            }
          } catch (error) {
            if (error.code === '40001') blocked = id;
            onStatus({ state: blocked ? 'conflict' : 'error', message: blocked
              ? 'A ficha mudou em outra aba. Sua cópia local foi preservada; exporte-a antes de recarregar.'
              : 'Falha ao salvar. Sua cópia local foi preservada. Tente novamente.' });
            return false;
          }
        }
        onStatus({ state: 'saved', message: 'Ficha salva.' });
        return true;
      })();
      try { return await running; } finally { running = null; }
    },
    hasPending() { return pending.size > 0; },
    revisionFor(id) { return revisions.get(id); },
    exportPending() { return Object.fromEntries(pending); },
    archivePending() {
      // Keep an exportable copy before choosing the server version after a conflict.
      const archiveKey = `asa-conflicts-v1:${ownerId}`;
      const previous = JSON.parse(storage?.getItem(archiveKey) || '[]');
      storage?.setItem(archiveKey, JSON.stringify([...previous, { at: new Date().toISOString(), drafts: Object.fromEntries(pending) }]));
      for (const id of pending.keys()) storage?.removeItem(key(id));
      pending.clear(); blocked = null;
    },
  };
}
