import { supabase } from '../lib/supabase';

const bucket = 'asa-materials';
export const CHUNK_SIZE = 5 * 1024 * 1024;
const unwrap = ({ data, error }) => { if (error) throw error; return data; };
export async function readMaterialFile(file) {
  const chunks = [];
  for (const path of file.parts) chunks.push(unwrap(await supabase.storage.from(bucket).download(path)));
  const blob = new Blob(chunks, { type: file.mime_type });
  if (blob.size !== Number(file.total_size)) throw new Error('Arquivo incompleto.');
  return blob;
}

export async function loadLibrary(missionId, manager) {
  const tables = ['asa_mission_materials', 'asa_mission_material_files', ...(manager ? ['asa_mission_material_notes'] : [])];
  const rows = await Promise.all(tables.map(table => supabase.from(table).select('*').eq('mission_id', missionId).then(unwrap)));
  return (rows[0] || []).map(material => ({ ...material,
    files: (rows[1] || []).filter(f => f.material_id === material.id && f.available),
    notes: (rows[2] || []).find(n => n.material_id === material.id),
  })).sort((a,b) => a.sort_order - b.sort_order || a.code.localeCompare(b.code));
}

export async function uploadMaterialFile(missionId, material, key, file, onProgress = () => {}) {
  if (!['application/pdf','image/png','image/jpeg','image/webp'].includes(file.type) || file.size > 150000000 || !file.size) throw new Error('Arquivo inválido ou maior que 150 MB.');
  const old = unwrap(await supabase.from('asa_mission_material_files').select('*').eq('mission_id',missionId).eq('material_id',material.id).eq('file_key',key).maybeSingle());
  const id = old?.id || crypto.randomUUID(), version = crypto.randomUUID();
  const count = Math.ceil(file.size / CHUNK_SIZE);
  const parts = Array.from({ length: count }, (_, i) => `${missionId}/${id}/${version}/${i}`);
  const row = { id, mission_id: missionId, material_id: material.id, file_key: key, file_name: file.name, mime_type: file.type, parts, total_size: file.size, available: false };
  unwrap(await supabase.from('asa_mission_material_files').upsert(row));
  const uploaded = [];
  try {
    for (let i = 0; i < count; i++) {
      unwrap(await supabase.storage.from(bucket).upload(parts[i], file.slice(i*CHUNK_SIZE,(i+1)*CHUNK_SIZE,'application/octet-stream'), { contentType: 'application/octet-stream', upsert: false }));
      uploaded.push(parts[i]); onProgress(i+1, count);
    }
    unwrap(await supabase.from('asa_mission_material_files').update({ available:true }).eq('id',id).eq('mission_id',missionId));
  } catch (error) {
    if (uploaded.length) await supabase.storage.from(bucket).remove(uploaded);
    if (old) unwrap(await supabase.from('asa_mission_material_files').upsert(old));
    else unwrap(await supabase.from('asa_mission_material_files').delete().eq('id',id).eq('mission_id',missionId));
    throw error;
  }
  if (old?.parts?.length) await supabase.storage.from(bucket).remove(old.parts);
}

export function validateImport(manifest, files, materials, contentPack) {
  if (manifest.version !== 1 || manifest.content_pack !== contentPack || contentPack !== 'asa_tower_2077' || !Array.isArray(manifest.files)) throw new Error('Este pacote pertence à missão A.S.A. Selecione a missão correta.');
  const byName = new Map(files.map(file => [file.name,file]));
  const seen = new Set();
  return manifest.files.map(entry => {
    const material = materials.find(m => m.code === entry.code), file = byName.get(entry.name);
    const identity = `${entry.code}:${entry.key}`;
    if (!material || !file || !entry.key || seen.has(identity)) throw new Error(`Pacote incompleto ou repetido: ${entry.name}`);
    if (file.size !== entry.size) throw new Error(`Tamanho incorreto: ${entry.name}`);
    seen.add(identity);
    return { material, file, key:entry.key };
  });
}
