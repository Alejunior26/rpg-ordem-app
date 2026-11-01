import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { loadLibrary, readMaterialFile, uploadMaterialFile, validateImport } from '../services/missionLibrary';
import './missionLibrary.css';

export function MaterialImage({ file, title }) {
  const [image,setImage] = useState({ id:'',url:'',error:'' });
  const fileVersion = file ? `${file.id}:${file.parts.join(',')}` : '';
  useEffect(() => {
    if (!file) return;
    let alive = true, url;
    readMaterialFile(file).then(blob => {
      if (alive) { url = URL.createObjectURL(blob); setImage({ id:fileVersion,url,error:'' }); }
    }).catch(() => { if(alive) setImage({ id:fileVersion,url:'',error:'Não foi possível abrir esta imagem.' }); });
    return () => { alive=false; if(url) URL.revokeObjectURL(url); };
  }, [fileVersion]);
  if (!file) return null;
  if (image.id !== fileVersion) return <p role="status">Abrindo imagem…</p>;
  return image.url ? <img className="ml-image" src={image.url} alt={title}/> : <p role="alert">{image.error}</p>;
}

export function BestiaryArtwork({ missionId, code }) {
  const [row,setRow] = useState(null);
  useEffect(() => {
    let alive = true; setRow(null);
    if (!code || !missionId) return;
    supabase.from('asa_mission_materials').select('id,title').eq('mission_id',missionId).eq('code',code).then(async ({data,error}) => {
      const material=data?.[0]; if(error || !material || !alive) return;
      const result=await supabase.from('asa_mission_material_files').select('*').eq('mission_id',missionId).eq('material_id',material.id).eq('file_key','image').eq('available',true);
      if(alive && !result.error) setRow({ ...material,file:result.data?.[0] });
    });
    return () => { alive=false; };
  }, [missionId,code]);
  return row?.file ? <MaterialImage key={`${missionId}:${code}`} file={row.file} title={row.title}/> : null;
}

const labels = { photo:'Fotografias', document:'Documentos', book:'Livros do mestre', threat:'Ameaças', opening:'Artes das missões' };
export default function MissionLibrary({ missionId, missionName, manager, contentPack = 'generic' }) {
  const [materials,setMaterials] = useState([]), [selected,setSelected] = useState(''), [kind,setKind] = useState('all');
  const [error,setError] = useState(''), [notice,setNotice] = useState(''), [loading,setLoading] = useState(true), [busy,setBusy] = useState(false), [back,setBack] = useState(false);
  const alive=useRef(true), busyRef=useRef(false), input=useRef(null), urls=useRef([]);
  async function refresh() {
    if (!missionId) { setLoading(false); return; }
    try { const rows=await loadLibrary(missionId,manager); if(alive.current) {setMaterials(rows);setError('');} }
    catch { if(alive.current) setError('Não foi possível carregar os materiais. Tente novamente.'); }
    finally { if(alive.current) setLoading(false); }
  }
  useEffect(() => {
    alive.current=true; void refresh();
    const timer=setInterval(() => { if(!busyRef.current) void refresh(); },15000);
    return () => { alive.current=false; clearInterval(timer); urls.current.forEach(url=>URL.revokeObjectURL(url)); };
  }, [missionId,manager]);
  const visible=materials.filter(m=>kind==='all'||m.kind===kind);
  const active=visible.find(m=>m.id===selected)||visible[0];
  async function release(material) {
    if(busyRef.current) return;
    busyRef.current=true;setBusy(true);setError('');
    try {
      const { error:failure }=await supabase.from('asa_mission_materials').update({released:!material.released}).eq('id',material.id).eq('mission_id',missionId);
      if(failure) throw failure;
      await refresh();setNotice(material.released?'Material recolhido da biblioteca dos jogadores.':'Material entregue aos jogadores desta missão.');
    } catch { setError('A entrega não foi salva. Confira a conexão.'); }
    finally {busyRef.current=false;setBusy(false);}
  }
  async function download(file) {
    busyRef.current=true;setBusy(true);setNotice('Preparando arquivo…');setError('');
    try {
      const blob=await readMaterialFile(file);
      if(!alive.current) return;
      const url=URL.createObjectURL(blob);urls.current.push(url);
      const anchor=document.createElement('a');anchor.href=url;anchor.download=file.file_name;anchor.click();setNotice('Arquivo pronto.');
    } catch { if(alive.current) setError('O arquivo não foi baixado. Tente novamente.'); }
    finally { if(alive.current) {busyRef.current=false;setBusy(false);} }
  }
  async function importFiles(event) {
    const files=Array.from(event.target.files||[]);event.target.value='';
    if(!files.length || busyRef.current) return;
    busyRef.current=true;setBusy(true);setError('');setNotice('Conferindo pacote…');
    try {
      const manifestFile=files.find(f=>f.name==='manifest.json');
      if(!manifestFile) throw new Error('Selecione manifest.json e todos os arquivos da pasta de importação.');
      const items=validateImport(JSON.parse(await manifestFile.text()),files,materials,contentPack);
      for(let i=0;i<items.length;i++) {
        const item=items[i];
        await uploadMaterialFile(missionId,item.material,item.key,item.file,(part,count)=>{
          if(alive.current) setNotice(`Enviando ${i+1}/${items.length}: ${item.material.code} · parte ${part}/${count}`);
        });
      }
      if(alive.current) { await refresh(); setNotice(`${items.length} arquivos importados. Todos continuam com a liberação definida pelo mestre.`); }
    } catch(failure) { if(alive.current) setError(`Importação interrompida: ${failure.message||'falha de conexão'}. Os arquivos concluídos foram preservados; você pode selecionar o pacote novamente.`); }
    finally {if(alive.current) {busyRef.current=false;setBusy(false);}}
  }
  return <section className="ml-shell" aria-label="Materiais da missão">
    <header className="ml-header"><div><span className="ml-eyebrow">ARQUIVO DA MISSÃO</span><h2>Materiais · {missionName||'Selecione uma missão'}</h2><p>{manager?'Organize as descobertas e entregue cada item quando chegar a hora.':'Documentos e fotografias entregues pelo mestre.'}</p></div>
      <button onClick={()=>void refresh()} disabled={busy}>Atualizar</button></header>
    {manager && contentPack==='asa_tower_2077' && <details className="ml-import"><summary>Importar arquivos da edição 7.1</summary><p>Selecione todos os arquivos da pasta, incluindo manifest.json. Livros completos permanecem exclusivos do mestre.</p><input ref={input} aria-label="Arquivos do pacote da campanha" type="file" multiple disabled={busy||loading} onChange={importFiles}/></details>}
    {notice && <p role="status">{notice}</p>}{error && <p role="alert" className="ml-error">{error}</p>}
    {loading?<p role="status">Carregando materiais…</p>:!materials.length?<div className="ml-empty"><h3>Nenhum material nesta missão</h3><p>{manager?'Missões novas começam sem documentos ou imagens de outras campanhas. Use a mesa e o NPC de treinamento para testar.':'Os itens aparecerão aqui quando o mestre os entregar.'}</p></div>:<>
      <label className="ml-filter">Exibir <select value={kind} onChange={e=>{setKind(e.target.value);setBack(false);}}><option value="all">Todos</option>{Object.entries(labels).filter(([key])=>materials.some(m=>m.kind===key)).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
      <div className="ml-layout"><aside className="ml-list" aria-label="Lista de materiais">{visible.map(m=><button key={m.id} aria-pressed={active?.id===m.id} onClick={()=>{setSelected(m.id);setBack(false);}}><small>{m.code}{manager?m.gm_only?' · Só mestre':m.released?' · Entregue':' · Oculto':''}</small><strong>{m.title}</strong></button>)}</aside>
        {active && <article className="ml-detail" key={active.id}><header><span className="ml-eyebrow">{active.code} / {labels[active.kind]||'Material'}</span><h3>{active.title}</h3></header>
          {manager && active.notes && <div className="ml-notes"><strong>Reservado ao mestre · {active.notes.scene}</strong><p>Onde encontrar: {active.notes.place||'Conforme a cena indicada no livro.'}</p>{active.notes.note && <p>{active.notes.note}</p>}</div>}
          {manager && !active.gm_only && <button disabled={busy} className="ml-release" onClick={()=>void release(active)}>{active.released?'Recolher dos jogadores':'Entregar aos jogadores'}</button>}
          {active.kind==='photo' && <button disabled={busy} onClick={()=>setBack(!back)}>{back?'Ver frente':'Virar fotografia'}</button>}
          {active.kind==='photo' && back?<div className="ml-verso"><small>{active.code} / VERSO</small><p>{active.body||'A.S.A. · Arquivo institucional · 2077'}</p></div>:<>
            {active.files.filter(f=>f.mime_type.startsWith('image/')).map(f=><MaterialImage key={f.id} file={f} title={active.title}/>)}
            {active.kind!=='photo' && active.body && <div className="ml-paper">{active.body}</div>}
          </>}
          {!active.files.length && active.kind!=='document' && <p className="ml-muted">{manager?'Arquivo visual ainda não enviado. O texto e as notas já estão disponíveis.':'Arquivo visual indisponível no momento.'}</p>}
          <div className="ml-downloads">{active.files.map(f=><button key={f.id} disabled={busy} onClick={()=>void download(f)}>Baixar {f.mime_type==='application/pdf'?'PDF':f.file_key==='image'?'imagem':f.file_key}</button>)}</div>
        </article>}
      </div></>}
  </section>;
}
