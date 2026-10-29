import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useMissionCombat(missionId) {
  const [state, setState] = useState(null);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const current = useRef({ missionId, state: null });
  const actionRunning = useRef(false);
  const refreshVersion = useRef(0);
  if (current.current.missionId !== missionId) current.current = { missionId, state: null };

  const accept = useCallback((row, target) => {
    if (current.current.missionId !== target || !row) return;
    if (!current.current.state || row.version >= current.current.state.version) {
      current.current.state = row;
      setState(row);
    }
  }, []);
  const refresh = useCallback(async () => {
    if (!missionId) return;
    const requestVersion = ++refreshVersion.current;
    const { data, error: failure } = await supabase.rpc('asa_combat_action', { p_mission_id: missionId, p_event: 'READ' });
    if (current.current.missionId !== missionId || requestVersion !== refreshVersion.current) return;
    if (failure) { setError('Não foi possível carregar o combate. Verifique a conexão e a configuração da campanha.'); return; }
    accept(data, missionId);
    const result = await supabase.from('asa_combat_log').select('*').eq('mission_id', missionId)
      .gte('created_at', data.reset_at).order('id', { ascending: false }).limit(100);
    if (current.current.missionId !== missionId || requestVersion !== refreshVersion.current) return;
    if (result.error) { setError('Não foi possível carregar a timeline.'); return; }
    setLogs(result.data || []);
    setError('');
  }, [missionId, accept]);

  useEffect(() => {
    setState(null); setLogs([]); setError('');
    if (!missionId) return;
    let disposed = false;
    const reload = () => { if (!disposed) void refresh(); };
    const channel = supabase.channel(`combat:${missionId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'asa_combat_state', filter: `mission_id=eq.${missionId}` }, reload)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'asa_combat_log', filter: `mission_id=eq.${missionId}` }, reload)
      .subscribe(reload);
    reload();
    const poll = setInterval(reload, 15000);
    window.addEventListener('online', reload);
    return () => { disposed = true; clearInterval(poll); window.removeEventListener('online', reload); supabase.removeChannel(channel); };
  }, [missionId, refresh]);

  async function action(event, payload) {
    const target = missionId;
    if (!target || !current.current.state || actionRunning.current) return false;
    actionRunning.current = true; setBusy(true);
    try {
      const { data, error: failure } = await supabase.rpc('asa_combat_action', {
        p_mission_id: target, p_event: event, p_payload: payload, p_expected_version: current.current.state.version,
      });
      if (failure) {
        await refresh();
        setError(failure.code === '40001' ? 'A mesa mudou. Confira o turno atualizado e tente novamente.' : 'A ação não foi concluída. Confira sua vez, permissões e conexão.');
        return false;
      }
      accept(data, target); setError('');
      if (event === 'RESET') setLogs([]);
      return true;
    } finally { actionRunning.current = false; setBusy(false); }
  }

  async function appendLogs(rows) {
    if (!missionId || current.current.missionId !== missionId) return { error: new Error('Selecione uma missão.') };
    const result = await supabase.from('asa_combat_log').insert(rows.map((row) => ({ ...row, mission_id: missionId }))).select();
    if (result.error) setError('A mensagem não foi salva na timeline. Verifique a conexão.');
    else if (current.current.missionId === missionId) setLogs((prev) => [...(result.data || []), ...prev].filter((x, i, all) => all.findIndex((y) => y.id === x.id) === i).slice(0, 100));
    return result;
  }
  return { state: state?.mission_id === missionId ? state : null, logs, error, busy, action, appendLogs, refresh };
}
