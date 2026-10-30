import React from 'react';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { TabletopView } from './VirtualTabletop';
import { participantToken } from '../domain/tabletopCombat';
vi.mock('../lib/supabase',()=>({supabase:{}}));
afterEach(cleanup);
const scene={id:'scene',name:'Salão',columns:24,rows:18,fog:[],grid_visible:true,allow_player_moves:true};
const player={userId:'owner',kind:'player',nome:'Alice'};
const enemy={userId:'monster:1',kind:'monster',nome:'Segredo inominável'};
const token={id:'pc',name:'Alice',scene_id:'scene',owner_id:'owner',character_id:'char',kind:'player',visible:true,x:2,y:3,size:1,color:'#aabbcc'};
const secret={...token,id:'secret',kind:'enemy',name:enemy.nome,owner_id:null,character_id:null,visible:false,x:10};
function fixture(overrides={}) {
  const combat={state:{mission_id:'mission',rodada:2,participants:[player,enemy],turn_order:['owner','monster:1'],turn_index:0,turn_done_by:[]},logs:[{id:1,author_id:'owner',personagem:'Alice',acao:'Usou habilidade',rodada:2},{id:2,author_id:'gm',personagem:enemy.nome,acao:'Ataque secreto',rodada:2},{id:3,author_id:'owner',personagem:'Alice',acao:`Atacou ${enemy.nome}`,rodada:2}],busy:false,error:'',refresh:vi.fn(),...overrides.combat};
  return {missionId:'mission',userId:'owner',character:{id:'char'},manager:false,
    table:{scenes:[scene],tokens:[token,secret],assets:[],images:{},room:{active_scene_id:'scene'},loading:false,busy:false,updateToken:vi.fn(),updateScene:vi.fn()},
    onJoinCombat:vi.fn(),onFinishOwnTurn:vi.fn(),onFinishCurrentTurn:vi.fn(),onAdvanceRound:vi.fn(),renderCharacterPanel:vi.fn(()=><input aria-label="Ficha compartilhada"/>),renderCombatDirection:vi.fn(()=><button>Adicionar ameaça de teste</button>),...overrides,combat};
}
function openCombat() { fireEvent.click(screen.getByRole('button',{name:'Abrir combate'})); }
function closeCombat() { fireEvent.click(screen.getByRole('button',{name:'Fechar combate'})); }
function renderTable(props) {
  const result=render(<TabletopView {...props}/>);
  openCombat();
  return result;
}
it('shows safe player initiative/history, highlights and focuses the unique visible token without moving it',()=>{
  const props=fixture();const {container}=renderTable(props);
  expect(screen.queryByText(enemy.nome)).toBeNull();expect(screen.queryByText('Ataque secreto')).toBeNull();expect(screen.queryByText(`Atacou ${enemy.nome}`)).toBeNull();
  expect(screen.getByText('Usou habilidade')).toBeTruthy();expect(container.querySelector('.vt-turn-ring')).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Localizar Alice no mapa'}));
  openCombat();
  expect(container.querySelector('.vt-token.selected').textContent).toContain('Alice');expect(props.table.updateToken).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:'Finalizar meu turno'}));expect(props.onFinishOwnTurn).toHaveBeenCalledOnce();
  expect(screen.queryByText('Encerrar turno atual (Mestre)')).toBeNull();
  expect(screen.queryByRole('button',{name:'Adicionar ameaça de teste'})).toBeNull();
});
it('disables ending someone else’s turn, reports error and pending state',()=>{
  const props=fixture({combat:{state:{rodada:2,participants:[player,enemy],turn_order:['monster:1','owner'],turn_index:0,turn_done_by:[]},busy:true,error:'A mesa mudou'}});
  renderTable(props);
  const button=screen.getByRole('button',{name:'Aguardando sua vez'});expect(button.disabled).toBe(true);fireEvent.click(button);expect(props.onFinishOwnTurn).not.toHaveBeenCalled();
  expect(screen.getByText('A mesa mudou')).toBeTruthy();expect(screen.getByText('Salvando ação…')).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Reconectar combate'}));expect(props.combat.refresh).toHaveBeenCalledOnce();
});
it('labels another player’s current turn without telling the viewer it is their turn',()=>{
  const props=fixture({userId:'another-player'});
  renderTable(props);
  const initiative=screen.getByRole('list',{name:'Ordem de iniciativa'});
  expect(within(initiative).getByText('Em turno')).toBeTruthy();
  expect(within(initiative).queryByText('Sua vez')).toBeNull();
  expect(screen.queryByRole('button',{name:'Finalizar meu turno'})).toBeNull();
});
it('gives the master commands but removes them and all hidden content in preview, restoring view on exit',()=>{
  const props=fixture({manager:true});const {container}=renderTable(props);
  const finish=screen.getByRole('button',{name:'Encerrar turno atual (Mestre)'});fireEvent.click(finish);expect(props.onFinishCurrentTurn).toHaveBeenCalledOnce();
  expect(screen.getByText('Direção do combate (Mestre)').closest('details').open).toBe(true);
  expect(screen.getByRole('button',{name:'Adicionar ameaça de teste'})).toBeTruthy();
  expect(screen.getByRole('button',{name:'Avançar rodada'}).disabled).toBe(true);
  closeCombat();
  fireEvent.change(screen.getByLabelText('Zoom do mapa'),{target:{value:'200'}});
  openCombat();
  fireEvent.click(screen.getByRole('button',{name:'Localizar Segredo inominável no mapa'}));
  openCombat();
  expect(screen.queryByText('Ataque secreto')).toBeTruthy();
  closeCombat();
  fireEvent.click(screen.getByLabelText('Prévia dos jogadores'));
  openCombat();
  expect(screen.queryByRole('button',{name:'Encerrar turno atual (Mestre)'})).toBeNull();expect(screen.queryByText('Ações e ficha na mesa')).toBeNull();
  expect(screen.queryByRole('button',{name:'Adicionar ameaça de teste'})).toBeNull();
  expect(screen.queryByText('Ataque secreto')).toBeNull();expect(screen.queryByText(enemy.nome)).toBeNull();
  expect(screen.queryByRole('button',{name:'Finalizar meu turno'})).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:'Voltar à visão do mestre'}));
  expect(screen.getByLabelText('Prévia dos jogadores').checked).toBe(false);
  expect(screen.getByLabelText('Zoom do mapa').value).toBe('200');expect(screen.getByRole('button',{name:'Encerrar turno atual (Mestre)'})).toBeTruthy();
});
it('advances only a finished round; opens shared actions in the table',()=>{
  const props=fixture({manager:true,combat:{state:{rodada:2,participants:[player],turn_order:['owner'],turn_index:0,turn_done_by:['owner']}}});
  renderTable(props);
  fireEvent.click(screen.getByRole('button',{name:'Avançar rodada'}));expect(props.onAdvanceRound).toHaveBeenCalledOnce();
  fireEvent.click(screen.getByText('Ações e ficha na mesa'));fireEvent.change(screen.getByLabelText('Área de ação'),{target:{value:'inventario'}});
  expect(props.renderCharacterPanel).toHaveBeenLastCalledWith('inventario');expect(screen.getByLabelText('Ficha compartilhada')).toBeTruthy();
});
it('lets the master leave preview even while combat is unavailable',()=>{
  const props=fixture({manager:true,combat:{state:null,error:'Sem conexão com o combate'}});
  renderTable(props);
  closeCombat();
  fireEvent.click(screen.getByLabelText('Prévia dos jogadores'));
  openCombat();
  expect(screen.queryByRole('button',{name:'Adicionar ameaça de teste'})).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:'Voltar à visão do mestre'}));
  expect(screen.getByLabelText('Prévia dos jogadores').checked).toBe(false);
  expect(screen.getByText('Visão do mestre')).toBeTruthy();
});
it('does not guess by name or choose among multiple owned tokens; hidden token cannot be focused or highlighted for players',()=>{
  expect(participantToken(player,scene,[token,{...token,id:'second',visible:false}],false)).toBeNull();
  expect(participantToken({...player,userId:'other'},scene,[token],false)).toBeNull();
  const props=fixture();props.table.tokens=[{...token,visible:false},secret];
  const {container}=renderTable(props);
  expect(screen.getByRole('button',{name:'Localizar Alice no mapa'}).disabled).toBe(true);expect(container.querySelector('.vt-turn-ring')).toBeNull();
});
it('keeps pan/zoom and a selected token after combat changes and after action edits',()=>{
  const props=fixture();const {container,rerender}=renderTable(props);
  const stage=container.querySelector('.vt-stage');stage.getBoundingClientRect=()=>({left:0,top:0,width:800,height:600});
  fireEvent.click(screen.getByRole('button',{name:'Localizar Alice no mapa'}));
  fireEvent.wheel(stage,{deltaY:-100,clientX:400,clientY:300});
  const transform=container.querySelector('.vt-map-size').style.transform;
  const zoom=screen.getByLabelText('Zoom do mapa').value;
  rerender(<TabletopView {...props} combat={{...props.combat,state:{...props.combat.state,rodada:3}}}/>);
  openCombat();
  fireEvent.change(screen.getByLabelText('Área de ação'),{target:{value:'pericias'}});
  expect(container.querySelector('.vt-map-size').style.transform).toBe(transform);expect(screen.getByLabelText('Zoom do mapa').value).toBe(zoom);
  expect(container.querySelector('.vt-token.selected')).toBeTruthy();expect(props.table.updateToken).not.toHaveBeenCalled();
});
it('keeps the selected action and draft while closed and reflects pending combat when reopened',()=>{
  const props=fixture();
  const {rerender}=renderTable(props);
  fireEvent.change(screen.getByLabelText('Área de ação'),{target:{value:'inventario'}});
  fireEvent.change(screen.getByLabelText('Ficha compartilhada'),{target:{value:'Ação preparada'}});
  closeCombat();
  expect(screen.queryByRole('dialog')).toBeNull();
  rerender(<TabletopView {...props} combat={{...props.combat,busy:true}}/>);
  openCombat();
  expect(screen.getByLabelText('Área de ação').value).toBe('inventario');
  expect(screen.getByLabelText('Ficha compartilhada').value).toBe('Ação preparada');
  expect(screen.getByRole('button',{name:'Finalizar meu turno'}).disabled).toBe(true);
});
