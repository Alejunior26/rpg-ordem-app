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
    onJoinCombat:vi.fn(),onFinishOwnTurn:vi.fn(),onFinishCurrentTurn:vi.fn(),onAdvanceRound:vi.fn(),renderCharacterPanel:vi.fn(()=><input aria-label="Ficha compartilhada"/>),...overrides,combat};
}
it('shows safe player initiative/history, highlights and focuses the unique visible token without moving it',()=>{
  const props=fixture();const {container}=render(<TabletopView {...props}/>);
  expect(screen.queryByText(enemy.nome)).toBeNull();expect(screen.queryByText('Ataque secreto')).toBeNull();expect(screen.queryByText(`Atacou ${enemy.nome}`)).toBeNull();
  expect(screen.getByText('Usou habilidade')).toBeTruthy();expect(container.querySelector('.vt-turn-ring')).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Localizar Alice no mapa'}));
  expect(container.querySelector('.vt-token.selected').textContent).toContain('Alice');expect(props.table.updateToken).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:'Finalizar meu turno'}));expect(props.onFinishOwnTurn).toHaveBeenCalledOnce();
  expect(screen.queryByText('Encerrar turno atual (Mestre)')).toBeNull();
});
it('disables ending someone else’s turn, reports error and pending state',()=>{
  const props=fixture({combat:{state:{rodada:2,participants:[player,enemy],turn_order:['monster:1','owner'],turn_index:0,turn_done_by:[]},busy:true,error:'A mesa mudou'}});
  render(<TabletopView {...props}/>);
  const button=screen.getByRole('button',{name:'Aguardando sua vez'});expect(button.disabled).toBe(true);fireEvent.click(button);expect(props.onFinishOwnTurn).not.toHaveBeenCalled();
  expect(screen.getByText('A mesa mudou')).toBeTruthy();expect(screen.getByText('Salvando ação…')).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Reconectar combate'}));expect(props.combat.refresh).toHaveBeenCalledOnce();
});
it('gives the master commands but removes them and all hidden content in preview, restoring view on exit',()=>{
  const props=fixture({manager:true});const {container}=render(<TabletopView {...props}/>);
  const finish=screen.getByRole('button',{name:'Encerrar turno atual (Mestre)'});fireEvent.click(finish);expect(props.onFinishCurrentTurn).toHaveBeenCalledOnce();
  expect(screen.getByRole('button',{name:'Avançar rodada'}).disabled).toBe(true);
  fireEvent.change(screen.getByLabelText('Zoom do mapa'),{target:{value:'200'}});
  fireEvent.click(screen.getByRole('button',{name:'Localizar Segredo inominável no mapa'}));
  expect(screen.queryByText('Ataque secreto')).toBeTruthy();
  fireEvent.click(screen.getByLabelText('Prévia dos jogadores'));
  expect(screen.queryByRole('button',{name:'Encerrar turno atual (Mestre)'})).toBeNull();expect(screen.queryByText('Ações e ficha na mesa')).toBeNull();
  expect(screen.queryByText('Ataque secreto')).toBeNull();expect(screen.queryByText(enemy.nome)).toBeNull();
  expect(screen.queryByRole('button',{name:'Finalizar meu turno'})).toBeNull();
  fireEvent.click(screen.getByLabelText('Prévia dos jogadores'));
  expect(screen.getByLabelText('Zoom do mapa').value).toBe('200');expect(screen.getByRole('button',{name:'Encerrar turno atual (Mestre)'})).toBeTruthy();
});
it('advances only a finished round; opens shared actions in the table',()=>{
  const props=fixture({manager:true,combat:{state:{rodada:2,participants:[player],turn_order:['owner'],turn_index:0,turn_done_by:['owner']}}});
  render(<TabletopView {...props}/>);
  fireEvent.click(screen.getByRole('button',{name:'Avançar rodada'}));expect(props.onAdvanceRound).toHaveBeenCalledOnce();
  fireEvent.click(screen.getByText('Ações e ficha na mesa'));fireEvent.change(screen.getByLabelText('Área de ação'),{target:{value:'inventario'}});
  expect(props.renderCharacterPanel).toHaveBeenLastCalledWith('inventario');expect(screen.getByLabelText('Ficha compartilhada')).toBeTruthy();
});
it('does not guess by name or choose among multiple owned tokens; hidden token cannot be focused or highlighted for players',()=>{
  expect(participantToken(player,scene,[token,{...token,id:'second',visible:false}],false)).toBeNull();
  expect(participantToken({...player,userId:'other'},scene,[token],false)).toBeNull();
  const props=fixture();props.table.tokens=[{...token,visible:false},secret];
  const {container}=render(<TabletopView {...props}/>);
  expect(screen.getByRole('button',{name:'Localizar Alice no mapa'}).disabled).toBe(true);expect(container.querySelector('.vt-turn-ring')).toBeNull();
});
it('keeps pan/zoom and a selected token after combat changes and after action edits',()=>{
  const props=fixture();const {container,rerender}=render(<TabletopView {...props}/>);
  const stage=container.querySelector('.vt-stage');stage.getBoundingClientRect=()=>({left:0,top:0,width:800,height:600});
  fireEvent.click(screen.getByRole('button',{name:'Localizar Alice no mapa'}));
  fireEvent.wheel(stage,{deltaY:-100,clientX:400,clientY:300});
  const transform=container.querySelector('.vt-map-size').style.transform;
  const zoom=screen.getByLabelText('Zoom do mapa').value;
  rerender(<TabletopView {...props} combat={{...props.combat,state:{...props.combat.state,rodada:3}}}/>);
  fireEvent.click(screen.getByText('Ações e ficha na mesa'));fireEvent.change(screen.getByLabelText('Área de ação'),{target:{value:'pericias'}});
  expect(container.querySelector('.vt-map-size').style.transform).toBe(transform);expect(screen.getByLabelText('Zoom do mapa').value).toBe(zoom);
  expect(container.querySelector('.vt-token.selected')).toBeTruthy();expect(props.table.updateToken).not.toHaveBeenCalled();
});
