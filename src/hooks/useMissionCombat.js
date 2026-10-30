import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

const PAGE = 100;
const mergeLogs = (rows) => [...new Map(rows.map((row) => [row.id, row])).values()]
  .sort((a, b) => Number(b.id) - Number(a.id));
const empty = { state: null, logs: [], error: '', busy: false, logBusy: false, historyBusy: false, hasMoreLogs: false };

export function useMissionCombat(missionId) {
  const scope = useMemo(() => ({ missionId, state: null, running: false, logging: false, reading: 0, history: false, historyLoaded: false, reset: null }), [missionId]);
  const current = useRef(scope);
  current.current = scope;
  const [snapshot, setSnapshot] = useState({ scope, ...empty });
  const live = useCallback(() => current.current === scope && scope.alive !== false, [scope]);
  const patch = useCallback((update) => {
    if (live()) setSnapshot((prev) => live() ? ({ ...(prev.scope === scope ? prev : { ...empty, scope }), ...update }) : prev);
  }, [scope, live]);
  const accept = useCallback((row) => {
    if (!live() || !row || row.mission_id !== missionId || (scope.state && row.version < scope.state.version)) return false;
    const resetChanged = scope.reset !== row.reset_at;
    if (resetChanged) scope.historyLoaded = false;
    scope.state = row;
    scope.reset = row.reset_at;
    patch({ state: row, ...(resetChanged ? { logs: [], hasMoreLogs: false } : {}) });
    return true;
  }, [missionId, scope, live, patch]);

  const refresh = useCallback(async () => {
    if (!missionId || !live()) return;
    const ticket = ++scope.reading;
    try {
      const { data, error } = await supabase.rpc('asa_combat_action', { p_mission_id: missionId, p_event: 'READ' });
      if (!live() || ticket !== scope.reading) return;
      if (error || !data) throw error || new Error('No state');
      if (!accept(data)) return;
      const result = await supabase.from('asa_combat_log').select('*').eq('mission_id', missionId)
        .gte('created_at', data.reset_at).order('id', { ascending: false }).limit(PAGE);
      if (!live() || ticket !== scope.reading || scope.reset !== data.reset_at) return;
      if (result.error) throw result.error;
      setSnapshot((prev) => !live() || prev.scope !== scope || scope.reset !== data.reset_at ? prev : ({ ...prev, error: '',
        logs: mergeLogs([...(result.data || []), ...(prev.scope === scope ? prev.logs : [])]),
        hasMoreLogs: scope.historyLoaded ? prev.hasMoreLogs : result.data?.length === PAGE }));
    } catch {
      patch({ error: 'Não foi possível carregar o combate e o histórico. Verifique a conexão e tente novamente.' });
    }
  }, [missionId, scope, live, accept, patch]);

  useEffect(() => {
    scope.alive = true;
    patch(empty);
    if (!missionId) return () => { scope.alive = false; };
    let disposed = false;
    const reload = () => { if (!disposed) void refresh(); };
    const channel = supabase.channel(`combat:${missionId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'asa_combat_state', filter: `mission_id=eq.${missionId}` }, reload)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'asa_combat_log', filter: `mission_id=eq.${missionId}` }, reload)
      .subscribe(reload);
    reload();
    const poll = setInterval(reload, 15000);
    window.addEventListener('online', reload);
    return () => { disposed = true; scope.alive = false; clearInterval(poll); window.removeEventListener('online', reload); supabase.removeChannel(channel); };
  }, [missionId, scope, patch, refresh]);

  async function action(event, payload) {
    if (!missionId || !live() || !scope.state || scope.running) return false;
    scope.running = true; patch({ busy: true });
    try {
      const { data, error } = await supabase.rpc('asa_combat_action', {
        p_mission_id: missionId, p_event: event, p_payload: payload, p_expected_version: scope.state.version,
      });
      if (!live()) return false;
      if (error) {
        await refresh();
        patch({ error: error.code === '40001' ? 'A mesa mudou. Confira o turno atualizado e tente novamente.' : 'A ação não foi concluída. Confira sua vez, permissões e conexão.' });
        return false;
      }
      accept(data); patch({ error: '' });
      return true;
    } catch {
      patch({ error: 'A ação não foi confirmada. Reconecte o combate antes de tentar novamente.' });
      return false;
    } finally { scope.running = false; patch({ busy: false }); }
  }

  async function appendLogs(rows) {
    if (!missionId || !live() || scope.logging) return { error: new Error('Aguarde a ação ou selecione uma missão.') };
    scope.logging = true; patch({ logBusy: true });
    const reset = scope.reset;
    try {
      const result = await supabase.from('asa_combat_log').insert(rows.map((row) => ({ ...row, mission_id: missionId }))).select();
      if (!live() || scope.reset !== reset) return { error: new Error('A missão ou o combate mudou.') };
      if (result.error) patch({ error: 'A mensagem não foi salva no histórico. Verifique a conexão.' });
      else setSnapshot((prev) => !live() || prev.scope !== scope || scope.reset !== reset ? prev : ({ ...prev, logs: mergeLogs([...(result.data || []), ...prev.logs]), error: '' }));
      return result;
    } catch (error) {
      patch({ error: 'A mensagem não foi confirmada no histórico. Verifique a conexão.' });
      return { error };
    } finally { scope.logging = false; patch({ logBusy: false }); }
  }

  async function loadMoreLogs() {
    if (!live() || scope.history || !scope.state || snapshot.scope !== scope || !snapshot.logs.length) return;
    scope.history = true; patch({ historyBusy: true });
    const reset = scope.reset;
    try {
      const result = await supabase.from('asa_combat_log').select('*').eq('mission_id', missionId)
        .gte('created_at', reset).lt('id', snapshot.logs.at(-1).id).order('id', { ascending: false }).limit(PAGE);
      if (!live() || scope.reset !== reset) return;
      if (result.error) throw result.error;
      scope.historyLoaded = true;
      setSnapshot((prev) => !live() || prev.scope !== scope || scope.reset !== reset ? prev : ({ ...prev, logs: mergeLogs([...prev.logs, ...(result.data || [])]), hasMoreLogs: result.data?.length === PAGE }));
    } catch { patch({ error: 'Não foi possível carregar ações anteriores. Tente novamente.' }); }
    finally { scope.history = false; patch({ historyBusy: false }); }
  }
  return { ...(snapshot.scope === scope ? snapshot : empty), action, appendLogs, refresh, loadMoreLogs };
}
