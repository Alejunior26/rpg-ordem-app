import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import App from './App';
const fake = vi.hoisted(() => ({ user: {id: '00000000-0000-4000-8000-000000000001', email: 'player@example.test'}, rpc: vi.fn(), channels: [], logs: [], role: 'player', state: null, logError: null, noCharacters: false }));
const userId = '00000000-0000-4000-8000-000000000001';
const missionId = '00000000-0000-4000-8000-000000000010';
const characterId = '00000000-0000-4000-8000-000000000020';
const scene = { id: 'scene', columns: 24, rows: 18, fog: [], grid_visible: true, allow_player_moves: true };
vi.mock('./auth/AuthProvider', () => ({useAuth: () => ({user: fake.user, role: fake.role, loading: false, signOut: vi.fn()})}));
vi.mock('./hooks/useTabletop', () => ({ useTabletop: () => ({ scenes: [scene], tokens: [], images: {}, assets: [], room: {active_scene_id:'scene'}, loading: false, busy: false }) }));
vi.mock('./lib/supabase', () => ({supabase: {
  rpc: (...args) => fake.rpc(...args),
  channel: (name) => { const ch = {name, handlers: [], on(event, config, handler) {this.handlers.push({event, config, handler}); return this;}, subscribe() {return this;} }; fake.channels.push(ch); return ch; },
  removeChannel: vi.fn(),
  from: (table) => {
    let insert;
    const filters = [];
    const builder = {select(){return this;},eq(k,v){filters.push([k,v]);return this;},gte(){return this;},order(){return this;},limit(){return this;},insert(rows){insert=rows; return this;},then(resolve) {
      const mission={id:missionId,name:'Missão de teste'};
      let data=table==='missions'?[mission]:table==='characters'?(fake.noCharacters?[]:[{id:characterId,owner_id:userId,name:'Agent A',mission_id:missionId,revision:0,sheet_json:{nomePersonagem:'Agent A',pvAtual:11,setupComplete:true}}]):table==='asa_combat_log'?fake.logs:[];
      if(insert) {data=insert.map((r,i)=>({...r,id:fake.logs.length+i+1,author_id:userId})); fake.logs=[...data,...fake.logs];}
      if(table!=='asa_combat_log') for(const [k,v] of filters) data=data.filter(r=>r[k]===v);
      return Promise.resolve({data,error:insert?fake.logError:null}).then(resolve);
    }}; return builder;
  },
}}));
beforeEach(() => {
  window.localStorage.clear(); fake.role='player'; fake.channels=[]; fake.logs=[]; fake.logError=null; fake.noCharacters=false;
  fake.state={mission_id:missionId,version:1,rodada:3,participants:[],turn_order:[],turn_index:0,turn_done_by:[],reset_at:'2026-01-01'};
  fake.rpc.mockReset(); fake.rpc.mockImplementation(async(name,p)=>{
    if(name==='asa_save_character') return {data:{revision:p.p_expected_revision+1}};
    if(name!=='asa_combat_action') return {data:[]};
    if(p.p_event==='JOIN') fake.state={...fake.state,version:2,participants:[{userId,kind:'player',nome:'Agent A'}],turn_order:[userId]};
    if(p.p_event==='TURN_DONE') fake.state={...fake.state,version:3,turn_done_by:[userId]};
    return {data:fake.state,error:null};
  });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
async function openTable() {
  render(<App/>);
  await screen.findByDisplayValue('Agent A');
  fireEvent.click(screen.getByText('Confirmar missão e personagem'));
  fireEvent.click(await screen.findByTitle('Mesa virtual'));
  fireEvent.click(await screen.findByRole('button',{name:'Abrir combate'}));
  await screen.findByRole('dialog',{name:'Combate'});
  await screen.findByText('Combate · Rodada 3');
}
it('shares the real app combat state between table and combat tab; JOIN forwards the owned character', async () => {
  await openTable();
  fireEvent.click(screen.getByRole('button',{name:'Entrar no combate'}));
  await waitFor(()=>expect(fake.rpc.mock.calls.some(([n,p])=>n==='asa_combat_action'&&p.p_event==='JOIN')).toBe(true));
  const join = fake.rpc.mock.calls.find(([n,p])=>n==='asa_combat_action'&&p.p_event==='JOIN')[1];
  expect(join).toMatchObject({p_mission_id:missionId,p_expected_version:1,p_payload:{userId,characterId}});
  fireEvent.click(await screen.findByRole('button',{name:'Finalizar meu turno'}));
  await screen.findByRole('button',{name:'Turno já finalizado'});
  fireEvent.click(screen.getByRole('button',{name:'Fechar combate'}));
  fireEvent.click(screen.getByTitle('Mesa de Combate'));
  expect(await screen.findByText('Finalizou o turno.')).toBeTruthy();
  fireEvent.click(screen.getByTitle('Mesa virtual'));
  fireEvent.click(await screen.findByRole('button',{name:'Abrir combate'}));
  await screen.findByRole('button',{name:'Turno já finalizado'});
  expect(fake.channels.filter(ch=>ch.name===`combat:${missionId}`)).toHaveLength(1);
});
it('updates the table after a remote mission Realtime invalidation without another subscription', async () => {
  await openTable();
  fake.state={...fake.state,rodada:4,version:2,participants:[{userId,kind:'player',nome:'Agent A'}],turn_order:[userId]};
  await act(async()=>fake.channels.find(ch=>ch.name===`combat:${missionId}`).handlers[0].handler());
  await screen.findByText('Combate · Rodada 4');
  expect(screen.getByRole('button',{name:'Finalizar meu turno'}).disabled).toBe(false);
  expect(fake.channels).toHaveLength(1);
});
it('opens the original character controls inside the table without navigating away', async () => {
  await openTable();
  fireEvent.change(screen.getByLabelText('Área de ação'),{target:{value:'status'}});
  expect(await screen.findByText('A.S.A. BIO-MONITOR')).toBeTruthy();
  expect(screen.getByRole('region',{name:'Mesa virtual'})).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Área de ação'),{target:{value:'classe'}});
  expect(screen.getAllByText('ENVIAR PRO LOG').length).toBeGreaterThan(0);
  expect(screen.queryByText('Encerrar turno atual (Mestre)')).toBeNull();
  expect(screen.queryByText('Direção do combate (Mestre)')).toBeNull();
});

it.each(['dm', 'admin'])('lets a %s without a personal character add an NPC and set initiative directly from the table', async (role) => {
  const alert=vi.spyOn(window,'alert').mockImplementation(()=>{});
  fake.role=role; fake.noCharacters=true;
  fake.rpc.mockImplementation(async(name,p)=>{
    if(name!=='asa_combat_action') return {data:[]};
    if(p.p_event==='JOIN') fake.state={...fake.state,version:fake.state.version+1,participants:[...fake.state.participants,p.p_payload]};
    if(p.p_event==='SET_ORDER') fake.state={...fake.state,version:fake.state.version+1,turn_order:p.p_payload.order,turn_index:0,turn_done_by:[]};
    return {data:fake.state,error:null};
  });
  render(<App/>);
  await screen.findByRole('option',{name:'Missão de teste'});
  fireEvent.change(screen.getByLabelText('Missão'),{target:{value:missionId}});
  fireEvent.click(await screen.findByRole('button',{name:'Abrir mesa virtual como mestre'}));
  fireEvent.click(await screen.findByRole('button',{name:'Abrir combate'}));
  const direction=await screen.findByText('Direção do combate (Mestre)');
  expect(direction.closest('details').open).toBe(true);
  expect(screen.queryByText('Ações e ficha na mesa')).toBeNull();
  fireEvent.change(screen.getByPlaceholderText('Nome do monstro/NPC'),{target:{value:'Sentinela de teste'}});
  fireEvent.click(screen.getByRole('button',{name:'+ NPC'}));
  const participant=await screen.findByRole('checkbox',{name:'Sentinela de teste'});
  await waitFor(()=>expect(participant.checked).toBe(true));
  const joined=fake.rpc.mock.calls.find(([n,p])=>n==='asa_combat_action'&&p.p_event==='JOIN')[1];
  expect(joined.p_payload.userId).toMatch(/^npc:/);
  expect(joined.p_payload.characterId).toBeUndefined();
  const define=screen.getByRole('button',{name:'Definir ordem selecionada'});
  await waitFor(()=>expect(define.matches(':disabled')).toBe(false));
  fireEvent.click(define);
  await waitFor(()=>expect(fake.rpc.mock.calls.some(([n,p])=>n==='asa_combat_action'&&p.p_event==='SET_ORDER')).toBe(true));
  const order=fake.rpc.mock.calls.find(([n,p])=>n==='asa_combat_action'&&p.p_event==='SET_ORDER')[1];
  expect(order.p_mission_id).toBe(missionId);
  expect(order.p_payload.order).toEqual([joined.p_payload.userId]);
  await waitFor(()=>expect(screen.getByRole('button',{name:'Encerrar turno atual (Mestre)'}).disabled).toBe(false));
  expect(fake.rpc.mock.calls.some(([name])=>name==='asa_save_character')).toBe(false);
  expect(alert).not.toHaveBeenCalled();
});

it('executes the original ability handler from the table and reports a rejected log without success', async () => {
  const alert=vi.spyOn(window,'alert').mockImplementation(()=>{});
  await openTable();
  fireEvent.click(screen.getByRole('button',{name:'Entrar no combate'}));
  await screen.findByRole('button',{name:'Finalizar meu turno'});
  fireEvent.change(screen.getByLabelText('Área de ação'),{target:{value:'classe'}});
  fake.logError={code:'42501'};
  fireEvent.click(screen.getAllByText('ENVIAR PRO LOG')[0]);
  await screen.findAllByText('A mensagem não foi salva no histórico. Verifique a conexão.');
  expect(alert).not.toHaveBeenCalled();
  fake.logError=null;
  fireEvent.click(screen.getAllByText('ENVIAR PRO LOG')[0]);
  await waitFor(()=>expect(alert).toHaveBeenCalledOnce());
  expect(fake.logs[0]).toMatchObject({mission_id:missionId,personagem:'Agent A',rodada:3,author_id:userId});
  expect(fake.logs[0].acao).toContain('Usou a habilidade:');
  expect(screen.getByRole('region',{name:'Mesa virtual'})).toBeTruthy();
  alert.mockRestore();
});
