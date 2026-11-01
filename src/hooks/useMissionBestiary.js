import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { testBestiary } from '../data/testBestiary';

export function useMissionBestiary(missionId, manager, contentPack = 'generic') {
  const [snapshot, setSnapshot] = useState({ key: '', entries: [], error: '' });
  const key = `${missionId}:${manager}:${contentPack}`;
  useEffect(() => {
    let alive = true;
    if (!manager || !missionId || contentPack !== 'asa_tower_2077') return;
    supabase.from('asa_mission_bestiary').select('data').eq('mission_id', missionId)
      .then(({ data, error }) => {
        if (alive) setSnapshot({ key, entries: error ? [] : (data || []).map(row => row.data), error: error ? 'Não foi possível carregar o bestiário desta missão.' : '' });
      });
    return () => { alive = false; };
  }, [key, missionId, manager, contentPack]);
  if (!manager) return { entries: [], error: '' };
  if (contentPack !== 'asa_tower_2077') return { entries: testBestiary, error: '' };
  return snapshot.key === key ? snapshot : { entries: [], error: '' };
}
